import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Search, Info, Globe, AlertTriangle, CheckCircle, ServerCrash, HelpCircle, ArrowRight } from 'lucide-react';
import { HTTP_STATUS_TRANSLATIONS } from './httpStatusTranslations';

interface StatusCode {
   code: number;
   title: string;
   description: string;
   category: '1xx' | '2xx' | '3xx' | '4xx' | '5xx';
}

export const HTTP_STATUS = {
   1: [0, 1, 2, 3],
   2: [0, 1, 2, 3, 4, 5, 6],
   3: [0, 1, 2, 3, 4, 5, 7, 8],
   4: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 25, 26, 28, 29, 31, 51],
   5: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11]
}

const HTTP_CODES: StatusCode[] = [
   // 1xx Informational
   { code: 100, title: 'Continue', description: 'The server has received the request headers and the client should proceed to send the request body.', category: '1xx' },
   { code: 101, title: 'Switching Protocols', description: 'The requester has asked the server to switch protocols and the server has agreed to do so.', category: '1xx' },
   { code: 102, title: 'Processing', description: 'A WebDAV request may contain many sub-requests involving file operations, requiring a long time to complete the request.', category: '1xx' },
   { code: 103, title: 'Early Hints', description: 'Used to return some response headers before final HTTP message.', category: '1xx' },

   // 2xx Success
   { code: 200, title: 'OK', description: 'Standard response for successful HTTP requests.', category: '2xx' },
   { code: 201, title: 'Created', description: 'The request has been fulfilled, resulting in the creation of a new resource.', category: '2xx' },
   { code: 202, title: 'Accepted', description: 'The request has been accepted for processing, but the processing has not been completed.', category: '2xx' },
   { code: 203, title: 'Non-Authoritative Information', description: 'The server is a transforming proxy (e.g. a Web accelerator) that received a 200 OK from its origin, but is returning a modified version of the origin\'s response.', category: '2xx' },
   { code: 204, title: 'No Content', description: 'The server successfully processed the request and is not returning any content.', category: '2xx' },
   { code: 205, title: 'Reset Content', description: 'The server successfully processed the request, but is not returning any content. Unlike 204 response, this response requires that the requester reset the document view.', category: '2xx' },
   { code: 206, title: 'Partial Content', description: 'The server is delivering only part of the resource (byte serving) due to a range header sent by the client.', category: '2xx' },

   // 3xx Redirection
   { code: 300, title: 'Multiple Choices', description: 'Indicates multiple options for the resource from which the client may choose.', category: '3xx' },
   { code: 301, title: 'Moved Permanently', description: 'This and all future requests should be directed to the given URI.', category: '3xx' },
   { code: 302, title: 'Found', description: 'Tells the client to look at (browse to) another URL. 302 has been superseded by 303 and 307.', category: '3xx' },
   { code: 303, title: 'See Other', description: 'The response to the request can be found under another URI using the GET method.', category: '3xx' },
   { code: 304, title: 'Not Modified', description: 'Indicates that the resource has not been modified since the version specified by the request headers If-Modified-Since or If-None-Match.', category: '3xx' },
   { code: 305, title: 'Use Proxy', description: 'The requested resource is available only through a proxy, the address for which is provided in the response.', category: '3xx' },
   { code: 307, title: 'Temporary Redirect', description: 'In this case, the request should be repeated with another URI; however, future requests should still use the original URI.', category: '3xx' },
   { code: 308, title: 'Permanent Redirect', description: 'The request and all future requests should be repeated using another URI.', category: '3xx' },

   // 4xx Client Error
   { code: 400, title: 'Bad Request', description: 'The server cannot or will not process the request due to an apparent client error (e.g., malformed request syntax).', category: '4xx' },
   { code: 401, title: 'Unauthorized', description: 'Similar to 403 Forbidden, but specifically for use when authentication is required and has failed or has not yet been provided.', category: '4xx' },
   { code: 402, title: 'Payment Required', description: 'Reserved for future use. The original intention was that this code might be used as part of some form of digital cash or micropayment scheme.', category: '4xx' },
   { code: 403, title: 'Forbidden', description: 'The request was valid, but the server is refusing action. The user might not have the necessary permissions for a resource.', category: '4xx' },
   { code: 404, title: 'Not Found', description: 'The requested resource could not be found but may be available in the future.', category: '4xx' },
   { code: 405, title: 'Method Not Allowed', description: 'A request method is not supported for the requested resource; for example, a GET request on a form that requires data to be presented via POST.', category: '4xx' },
   { code: 406, title: 'Not Acceptable', description: 'The requested resource is capable of generating only content not acceptable according to the Accept headers sent in the request.', category: '4xx' },
   { code: 407, title: 'Proxy Authentication Required', description: 'The client must first authenticate itself with the proxy.', category: '4xx' },
   { code: 408, title: 'Request Timeout', description: 'The server timed out waiting for the request.', category: '4xx' },
   { code: 409, title: 'Conflict', description: 'Indicates that the request could not be processed because of conflict in the request, such as an edit conflict.', category: '4xx' },
   { code: 410, title: 'Gone', description: 'Indicates that the resource requested is no longer available and will not be available again.', category: '4xx' },
   { code: 411, title: 'Length Required', description: 'The request did not specify the length of its content, which is required by the requested resource.', category: '4xx' },
   { code: 412, title: 'Precondition Failed', description: 'The server does not meet one of the preconditions that the requester put on the request.', category: '4xx' },
   { code: 413, title: 'Payload Too Large', description: 'The request is larger than the server is willing or able to process.', category: '4xx' },
   { code: 414, title: 'URI Too Long', description: 'The URI provided was too long for the server to process.', category: '4xx' },
   { code: 415, title: 'Unsupported Media Type', description: 'The request entity has a media type which the server or resource does not support.', category: '4xx' },
   { code: 416, title: 'Range Not Satisfiable', description: 'The client has asked for a portion of the file (byte serving), but the server cannot supply that portion.', category: '4xx' },
   { code: 417, title: 'Expectation Failed', description: 'The server cannot meet the requirements of the Expect request-header field.', category: '4xx' },
   { code: 418, title: 'I\'m a teapot', description: 'Hyper Text Coffee Pot Control Protocol (HTCPCP/1.0) defined in RFC 2324.', category: '4xx' },
   { code: 421, title: 'Misdirected Request', description: 'The request was directed at a server that is not able to produce a response.', category: '4xx' },
   { code: 422, title: 'Unprocessable Entity', description: 'The request was well-formed but was unable to be followed due to semantic errors.', category: '4xx' },
   { code: 425, title: 'Too Early', description: 'Indicates that the server is unwilling to risk processing a request that might be replayed.', category: '4xx' },
   { code: 426, title: 'Upgrade Required', description: 'The client should switch to a different protocol such as TLS/1.0, given in the Upgrade header field.', category: '4xx' },
   { code: 428, title: 'Precondition Required', description: 'The origin server requires the request to be conditional.', category: '4xx' },
   { code: 429, title: 'Too Many Requests', description: 'The user has sent too many requests in a given amount of time.', category: '4xx' },
   { code: 431, title: 'Request Header Fields Too Large', description: 'The server is unwilling to process the request because either an individual header field, or all the header fields collectively, are too large.', category: '4xx' },
   { code: 451, title: 'Unavailable For Legal Reasons', description: 'A server operator has received a legal demand to deny access to a resource.', category: '4xx' },

   // 5xx Server Error
   { code: 500, title: 'Internal Server Error', description: 'A generic error message, given when an unexpected condition was encountered and no more specific message is suitable.', category: '5xx' },
   { code: 501, title: 'Not Implemented', description: 'The server either does not recognize the request method, or it lacks the ability to fulfill the request.', category: '5xx' },
   { code: 502, title: 'Bad Gateway', description: 'The server was acting as a gateway or proxy and received an invalid response from the upstream server.', category: '5xx' },
   { code: 503, title: 'Service Unavailable', description: 'The server is currently unavailable (because it is overloaded or down for maintenance).', category: '5xx' },
   { code: 504, title: 'Gateway Timeout', description: 'The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.', category: '5xx' },
   { code: 505, title: 'HTTP Version Not Supported', description: 'The server does not support the HTTP protocol version used in the request.', category: '5xx' },
   { code: 506, title: 'Variant Also Negotiates', description: 'Transparent content negotiation for the request results in a circular reference.', category: '5xx' },
   { code: 507, title: 'Insufficient Storage', description: 'The server is unable to store the representation needed to complete the request.', category: '5xx' },
   { code: 508, title: 'Loop Detected', description: 'The server detected an infinite loop while processing the request.', category: '5xx' },
   { code: 510, title: 'Not Extended', description: 'Further extensions to the request are required for the server to fulfill it.', category: '5xx' },
   { code: 511, title: 'Network Authentication Required', description: 'The client needs to authenticate to gain network access.', category: '5xx' },
];

const CATEGORIES = [
   { id: '1xx', label: '1xx Informational', icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
   { id: '2xx', label: '2xx Success', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
   { id: '3xx', label: '3xx Redirection', icon: ArrowRight, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
   { id: '4xx', label: '4xx Client Error', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
   { id: '5xx', label: '5xx Server Error', icon: ServerCrash, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
];

const HttpStatus: React.FC = () => {
   const { t, i18n } = useTranslation();
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

   const getLocalizedCode = (code: StatusCode): StatusCode => {
      // 如果当前语言是中文，使用翻译
      if (i18n.language.startsWith('zh')) {
         const translations = HTTP_STATUS_TRANSLATIONS.zh;
         const translated = translations[code.code as keyof typeof translations];
         if (translated) {
           return {
             ...code,
             title: translated.title,
             description: translated.description
           };
         }
      }
      // 默认返回英文
      return code;
   };

   const filteredCodes = useMemo(() => {
      return HTTP_CODES.map(getLocalizedCode).filter(code => {
         const matchesSearch =
            code.code.toString().includes(searchTerm) ||
            code.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            code.description.toLowerCase().includes(searchTerm.toLowerCase());

         const matchesCategory = selectedCategory ? code.category === selectedCategory : true;

         return matchesSearch && matchesCategory;
      });
   }, [searchTerm, selectedCategory, i18n.language]);

   return (
      <div className="flex flex-col space-y-6">

         {/* Search & Filter Toolbar */}
         <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input
                  type="text"
                  placeholder={t('tool.http-status.ui.search_placeholder')}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
               <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${!selectedCategory ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
               >
                  {t('tool.http-status.ui.all_codes')}
               </button>
               {CATEGORIES.map(cat => (
                  <button
                     key={cat.id}
                     onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                     className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border flex items-center gap-2 ${selectedCategory === cat.id ? `${cat.bg} ${cat.color} ${cat.border} ring-1` : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                     <cat.icon className="w-3 h-3" />
                     {t(`tool.http-status.category.${cat.id}`)}
                  </button>
               ))}
            </div>
         </div>

         {/* Results Grid */}
         <div>
            {filteredCodes.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCodes.map(code => {
                     const style = CATEGORIES.find(c => c.id === code.category);
                     const Icon = style?.icon || HelpCircle;

                     return (
                        <Card key={code.code} hover className="flex flex-col relative group overflow-hidden border-l-4" style={{ borderLeftColor: style?.color.replace('text-', 'var(--') }}>
                           {/* Colored stripe fallback if inline style fails or for custom visual */}
                           <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${style?.color}`}>
                              <Icon className="w-24 h-24 -mr-8 -mt-8" />
                           </div>

                           <div className="flex items-start justify-between mb-2 z-10">
                              <span className={`text-3xl font-black tracking-tighter ${style?.color}`}>
                                 {code.code}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${style?.bg} ${style?.color} border ${style?.border}`}>
                                 {code.category}
                              </span>
                           </div>

                           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 z-10 group-hover:text-primary-600 transition-colors">
                              {code.title}
                           </h3>

                           <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed z-10">
                              {code.description}
                           </p>
                        </Card>
                     );
                  })}
               </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Globe className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">{t('tool.http-status.ui.no_codes')}</p>
                  <p className="text-sm">{t('tool.http-status.ui.try_searching')}</p>
               </div>
            )}
         </div>
      </div>
   );
};

export default HttpStatus;