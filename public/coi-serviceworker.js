/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, licensed under MIT */
let coepCredentialless = false;
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener("message", (ev) => {
        if (!ev.data) {
            return;
        } else if (ev.data.type === "deregister") {
            self.registration
                .unregister()
                .then(() => {
                    return self.clients.matchAll();
                })
                .then(clients => {
                    clients.forEach((client) => client.navigate(client.url));
                });
        } else if (ev.data.type === "coepCredentialless") {
            coepCredentialless = ev.data.value;
        }
    });

    self.addEventListener("fetch", function (event) {
        const r = event.request;
        if (r.cache === "only-if-cached" && r.mode !== "same-origin") {
            return;
        }

        const headers = new Headers(r.headers);
        const origin = location.origin;
        if (origin !== r.origin) {
            headers.set("cross-origin-resource-policy", "cross-origin");
        }
        
        if (coepCredentialless && r.mode === "no-cors" && !(r.url.startsWith(origin) || r.url.startsWith("/"))) {
            headers.set("cross-origin-embedder-policy", "credentialless");
        } else if (headers.has("cross-origin-embedder-policy")) {
            headers.set("cross-origin-embedder-policy", "require-corp");
        }

        // Also handle Range requests for FFmpeg
        if (r.headers.get("range")) {
            headers.set("accept-range", "bytes");
        }

        const req = new Request(r, { headers });
        
        event.respondWith(
            fetch(req)
                .catch(error => {
                    console.error("Fetch failed:", error);
                    // Return a basic response for failed fetches
                    return new Response(null, {
                        status: 500,
                        statusText: "Internal Server Error"
                    });
                })
        );
    });

} else {
    (() => {
        // Skip if the browser doesn't support service workers
        if (!window.isSecureContext || !navigator.serviceWorker) {
            return;
        }

        // Check if the current registration is a noop
        const isNoop = (registration) => {
            // Fix: Check if registration.active exists and scriptURL exists before accessing
            return (registration.installing === null && 
                registration.waiting === null && 
                registration.active !== null &&
                registration.active.scriptURL && 
                registration.active.scriptURL.endsWith("coi-serviceworker.js"));
        };

        // Get the existing registration
        navigator.serviceWorker.getRegistration().then(registration => {
            // Fix: Handle case where currentScript might be null
            const scriptSrc = window.document.currentScript ? window.document.currentScript.src : 'coi-serviceworker.js';
            
            if (!registration) {
                // Register fresh
                navigator.serviceWorker.register(scriptSrc).then(
                    (reg) => {
                        reg.active?.postMessage({ type: "coepCredentialless", value: coepCredentialless });
                        window.location.reload();
                    },
                    (err) => console.error("COOP/COEP Service Worker failed to register:", err)
                );
            } else if (isNoop(registration)) {
                // Update the existing registration
                registration.update().then(
                    (reg) => {
                        reg.active?.postMessage({ type: "coepCredentialless", value: coepCredentialless });
                    },
                    (err) => console.error("COOP/COEP Service Worker failed to update:", err)
                );
            } else {
                // Different service worker installed, deregister it
                registration.unregister().then(() => {
                    navigator.serviceWorker.register(scriptSrc).then(
                        (reg) => {
                            reg.active?.postMessage({ type: "coepCredentialless", value: coepCredentialless });
                            window.location.reload();
                        },
                        (err) => console.error("COOP/COEP Service Worker failed to register:", err)
                    );
                });
            }
        }).catch(err => {
            console.error("Error getting service worker registration:", err);
        });
    })();
}