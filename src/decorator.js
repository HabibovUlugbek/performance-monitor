function route(target, { kind, name }) {
  if (kind !== "method") return target;

  return async function (request, response) {
    const { statusCode, message } = await target.apply(this, [
      request,
      response,
    ]);

    response.writeHead(statusCode);
    response.end(JSON.stringify(message));
  };
}

function responseTimeTracker(target, { kind, name }) {
  if (kind !== "method") return target;

  const reqId = randomUUID();

  const methodsTimeTracker = {
    GET: performance.now(),
    POST: performance.now(),
  };
  return function (request, response) {
    const requestStartedAt = performance.now();
    const afterExecution = target.apply(this, [request, response]);

    const data = {
      reqId,
      name,
      method: request.method,
      url: request.url,
    };

    const onFinally = onRequestEnded({
      data,
      response,
      requestStartedAt,
      methodsTimeTracker,
    });

    // assuming it'll always be a promise obj
    afterExecution.finally(onFinally);

    return afterExecution;
  };
}

module.exports = { route };
