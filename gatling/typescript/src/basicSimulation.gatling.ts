import {
  simulation,
  scenario,
  constantUsersPerSec,
  global,
  getParameter,
} from "@gatling.io/core";
import { http } from "@gatling.io/http";

const toNumber = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default simulation((setUp) => {
  const baseUrl = getParameter("baseUrl", "https://api-ecomm.gatling.io");
  const usersPerSec = toNumber(getParameter("usersPerSec", "1"), 1);
  const durationSeconds = toNumber(getParameter("durationSeconds", "1"), 1);

  const httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")
    .userAgentHeader(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    );

  const scn = scenario("Scenario").exec(http("Session").get("/session"));

  const assertion = global().failedRequests().count().lt(1.0);

  setUp(
    scn.injectOpen(constantUsersPerSec(usersPerSec).during(durationSeconds)),
  )
    .assertions(assertion)
    .protocols(httpProtocol);
});
