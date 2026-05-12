import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
} from "aws-lambda";

export const basicAuthorizer = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  try {
    const authorizationToken = event.authorizationToken;

    if (!authorizationToken) {
      throw new Error("Unauthorized");
    }

    if (!authorizationToken.startsWith("Basic ")) {
      return generatePolicy("user", "Deny", event.methodArn);
    }

    const base64Credentials = authorizationToken.split(" ")[1];
    const decodedCredentials = Buffer.from(
      base64Credentials,
      "base64",
    ).toString("utf-8");

    const [username, password] = decodedCredentials.split(":");

    const storedPassword = process.env[username];

    const isAuthorized = storedPassword && storedPassword === password;

    return generatePolicy(
      username,
      isAuthorized ? "Allow" : "Deny",
      event.methodArn,
    );
  } catch (error) {
    return generatePolicy("user", "Deny", event.methodArn);
  }
};

const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};
