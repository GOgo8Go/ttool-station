// HTTP Status Code translations
export const HTTP_STATUS_TRANSLATIONS = {
    zh: {
        // 1xx Informational
        100: { title: '继续', description: '服务器已收到请求头，客户端应继续发送请求体。' },
        101: { title: '切换协议', description: '请求者已要求服务器切换协议，服务器已确认并准备切换。' },
        102: { title: '处理中', description: 'WebDAV 请求可能包含许多涉及文件操作的子请求，需要很长时间才能完成请求。' },
        103: { title: '早期提示', description: '用于在最终 HTTP 消息之前返回一些响应头。' },

        // 2xx Success
        200: { title: '成功', description: 'HTTP 请求成功的标准响应。' },
        201: { title: '已创建', description: '请求已完成，并创建了新资源。' },
        202: { title: '已接受', description: '请求已被接受处理，但处理尚未完成。' },
        203: { title: '非权威信息', description: '服务器是转换代理（如 Web 加速器），从源服务器收到 200 OK，但返回的是源响应的修改版本。' },
        204: { title: '无内容', description: '服务器成功处理了请求，但不返回任何内容。' },
        205: { title: '重置内容', description: '服务器成功处理了请求，但不返回任何内容。与 204 不同，此响应要求请求者重置文档视图。' },
        206: { title: '部分内容', description: '由于客户端发送了范围头，服务器仅传送资源的一部分（字节服务）。' },

        // 3xx Redirection
        300: { title: '多种选择', description: '针对请求，服务器可执行多种操作。' },
        301: { title: '永久移动', description: '此请求和所有将来的请求都应定向到给定的 URI。' },
        302: { title: '找到', description: '告诉客户端查看（浏览到）另一个 URL。302 已被 303 和 307 取代。' },
        303: { title: '查看其他', description: '可以使用 GET 方法在另一个 URI 下找到对请求的响应。' },
        304: { title: '未修改', description: '表示资源自请求头 If-Modified-Since 或 If-None-Match 指定的版本以来未被修改。' },
        305: { title: '使用代理', description: '请求的资源只能通过代理访问，代理的地址在响应中提供。' },
        307: { title: '临时重定向', description: '在这种情况下，应使用另一个 URI 重复请求；但是，将来的请求仍应使用原始 URI。' },
        308: { title: '永久重定向', description: '请求和所有将来的请求都应使用另一个 URI 重复。' },

        // 4xx Client Error
        400: { title: '错误请求', description: '由于明显的客户端错误（例如，格式错误的请求语法），服务器无法或不会处理该请求。' },
        401: { title: '未授权', description: '与 403 Forbidden 类似，但专门用于需要身份验证但失败或尚未提供的情况。' },
        402: { title: '需要付款', description: '保留供将来使用。最初的意图是此代码可能用作某种形式的数字现金或微支付方案的一部分。' },
        403: { title: '禁止', description: '请求有效，但服务器拒绝操作。用户可能没有资源的必要权限。' },
        404: { title: '未找到', description: '找不到请求的资源，但将来可能可用。' },
        405: { title: '方法不允许', description: '请求的资源不支持请求方法；例如，需要通过 POST 提交数据的表单上的 GET 请求。' },
        406: { title: '不可接受', description: '请求的资源只能生成根据请求中发送的 Accept 头不可接受的内容。' },
        407: { title: '需要代理身份验证', description: '客户端必须首先使用代理进行身份验证。' },
        408: { title: '请求超时', description: '服务器等待请求超时。' },
        409: { title: '冲突', description: '表示由于请求中的冲突（例如编辑冲突）而无法处理请求。' },
        410: { title: '已删除', description: '表示请求的资源不再可用，并且不会再次可用。' },
        411: { title: '需要长度', description: '请求未指定其内容的长度，这是请求的资源所必需的。' },
        412: { title: '前提条件失败', description: '服务器不满足请求者在请求上设置的前提条件之一。' },
        413: { title: '负载过大', description: '请求大于服务器愿意或能够处理的大小。' },
        414: { title: 'URI 过长', description: '提供的 URI 太长，服务器无法处理。' },
        415: { title: '不支持的媒体类型', description: '请求实体具有服务器或资源不支持的媒体类型。' },
        416: { title: '范围无法满足', description: '客户端请求了文件的一部分（字节服务），但服务器无法提供该部分。' },
        417: { title: '期望失败', description: '服务器无法满足 Expect 请求头字段的要求。' },
        418: { title: '我是茶壶', description: 'RFC 2324 中定义的超文本咖啡壶控制协议 (HTCPCP/1.0)。' },
        421: { title: '错误定向请求', description: '请求被定向到无法生成响应的服务器。' },
        422: { title: '无法处理的实体', description: '请求格式正确，但由于语义错误而无法遵循。' },
        425: { title: '太早', description: '表示服务器不愿意冒险处理可能重放的请求。' },
        426: { title: '需要升级', description: '客户端应切换到不同的协议，例如 Upgrade 头字段中给出的 TLS/1.0。' },
        428: { title: '需要前提条件', description: '源服务器要求请求是有条件的。' },
        429: { title: '请求过多', description: '用户在给定时间内发送了太多请求。' },
        431: { title: '请求头字段太大', description: '服务器不愿意处理请求，因为单个头字段或所有头字段的总大小太大。' },
        451: { title: '因法律原因不可用', description: '服务器运营商已收到拒绝访问资源的法律要求。' },

        // 5xx Server Error
        500: { title: '内部服务器错误', description: '遇到意外情况且没有更具体的消息适合时给出的通用错误消息。' },
        501: { title: '未实现', description: '服务器不识别请求方法，或者缺乏完成请求的能力。' },
        502: { title: '错误网关', description: '服务器充当网关或代理，从上游服务器收到无效响应。' },
        503: { title: '服务不可用', description: '服务器当前不可用（因为过载或停机维护）。' },
        504: { title: '网关超时', description: '服务器充当网关或代理，未及时从上游服务器收到响应。' },
        505: { title: 'HTTP 版本不受支持', description: '服务器不支持请求中使用的 HTTP 协议版本。' },
        506: { title: '变体也在协商', description: '请求的透明内容协商导致循环引用。' },
        507: { title: '存储空间不足', description: '服务器无法存储完成请求所需的表示。' },
        508: { title: '检测到循环', description: '服务器在处理请求时检测到无限循环。' },
        510: { title: '未扩展', description: '服务器需要对请求进行进一步扩展才能完成它。' },
        511: { title: '需要网络身份验证', description: '客户端需要进行身份验证才能获得网络访问权限。' },
    }
};
