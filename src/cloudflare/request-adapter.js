export function adaptRequest(request) {
    const url = new URL(request.url);
    const headers = Object.fromEntries(request.headers.entries());
    
    return {
        url: url.pathname + url.search,
        method: request.method,
        headers: headers,
        body: request.body,
        socket: {
            remoteAddress: request.headers.get('cf-connecting-ip') || '127.0.0.1'
        },
        on: (event, callback) => {
            if (event === 'data' && request.body) {
                callback(request.body);
            }
            if (event === 'end') {
                callback();
            }
        }
    };
}

export function createResponseAdapter() {
    let statusCode = 200;
    let headers = {};
    let body = null;
    let ended = false;

    return {
        writeHead: (code, headersArg) => {
            statusCode = code;
            if (headersArg) {
                headers = { ...headers, ...headersArg };
            }
        },
        setHeader: (name, value) => {
            headers[name] = value;
        },
        getHeader: (name) => headers[name],
        removeHeader: (name) => {
            delete headers[name];
        },
        write: (data) => {
            if (!body) body = '';
            body += data;
        },
        end: (data) => {
            if (data) {
                if (!body) body = '';
                body += data;
            }
            ended = true;
        },
        json: (data) => {
            body = JSON.stringify(data);
            headers['Content-Type'] = 'application/json';
            ended = true;
        },
        getStatusCode: () => statusCode,
        getHeaders: () => headers,
        getBody: () => body,
        isEnded: () => ended
    };
}

export function adaptResponse(responseAdapter) {
    const statusCode = responseAdapter.getStatusCode();
    const headers = responseAdapter.getHeaders();
    const body = responseAdapter.getBody();

    return new Response(body, {
        status: statusCode,
        headers: headers
    });
}

export function createStreamingResponseAdapter() {
    let statusCode = 200;
    let headers = {};
    const chunks = [];

    return {
        writeHead: (code, headersArg) => {
            statusCode = code;
            if (headersArg) {
                headers = { ...headers, ...headersArg };
            }
        },
        setHeader: (name, value) => {
            headers[name] = value;
        },
        write: (chunk) => {
            chunks.push(chunk);
        },
        end: () => {
        },
        getStatusCode: () => statusCode,
        getHeaders: () => headers,
        getChunks: () => chunks
    };
}

export function adaptStreamingResponse(responseAdapter) {
    const statusCode = responseAdapter.getStatusCode();
    const headers = responseAdapter.getHeaders();
    const chunks = responseAdapter.getChunks();

    const stream = new ReadableStream({
        async start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(new TextEncoder().encode(chunk));
            }
            controller.close();
        }
    });

    return new Response(stream, {
        status: statusCode,
        headers: headers
    });
}
