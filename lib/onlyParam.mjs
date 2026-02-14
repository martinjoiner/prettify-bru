export const onlyParamOptions = {
    body: /^body:/,
    'body:json': /^body:json$/,
    json: /json$/,
    'body:graphql': /^body:graphql$/,
    graphql: /.+graphql/,
    'body:graphql:vars': /^body:graphql:vars$/,
    script: /^script:/,
    'script:pre-request': /^script:pre-request$/,
    'pre-request': /.+:pre-request$/,
    'script:post-response': /^script:post-response$/,
    'post-response': /.+:post-response$/,
    tests: /^tests$/,
}

/**
 * @param {?string} only Value to be validated
 * @throws Error
 * @returns void
 */
export function validateOnlyParam(only) {
    if (only !== null && !Object.hasOwn(onlyParamOptions, only)) {
        throw new Error('Invalid value for only parameter')
    }
}
