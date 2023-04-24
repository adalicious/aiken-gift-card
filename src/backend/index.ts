import axios, { AxiosRequestConfig } from "axios";

/**
 * Executes an HTTP Post to the internal API
 * @param route
 * @param body
 * @returns
 */
async function post(route: string, body = {}) {
  const postData: AxiosRequestConfig = {
    method: "POST",
    url: `/api/${route}`,
    headers: { "content-type": "application/json" },
    data: {
      ...body,
    },
  };

  return await axios(postData);
}

/**
 * Generates a jwt token with the secret provided
 * @param lockAddress
 * @param tokenName
 * @param giftCard
 * @param redeem
 * @param policyId
 * @param secret
 * @returns
 */
export async function postGenerateToken(
  lockAddress: string,
  tokenName: string,
  giftCard: string,
  redeem: string,
  policyId: string,
  secret: string
) {
  return await post(`/token`, { lockAddress, tokenName, giftCard, redeem, policyId, secret });
}
