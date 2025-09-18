import {
  simulation,
  constantUsersPerSec,
  scenario,
  feed,
  pause,
  exec,
  repeat,
  regex,
  csv,
  getParameter,
} from "@gatling.io/core";
import { http, ws } from "@gatling.io/http";

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const deriveWebSocketUrl = (httpUrl, fallback) => {
  try {
    const url = new URL(httpUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.toString();
  } catch {
    return fallback;
  }
};

export default simulation((setUp) => {
  const baseUrl = getParameter("baseUrl", "http://localhost:3000");
  const wsBaseUrl = getParameter(
    "wsBaseUrl",
    deriveWebSocketUrl(baseUrl, "ws://localhost:3000"),
  );
  const usersPerSec = toNumber(getParameter("usersPerSec", "2"), 2);
  const durationSeconds = toNumber(getParameter("durationSeconds", "15"), 15);

  const questionsFeeder = csv("resources/health_insurance_chatbot_questions.csv").random();

  const httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
    .doNotTrackHeader("1")
    .acceptLanguageHeader("en-US,en;q=0.5")
    .acceptEncodingHeader("gzip, deflate")
    .userAgentHeader("Gatling2")
    .wsBaseUrl(wsBaseUrl);

  const scn = scenario("WebSocket")
    .exec(
      http("Home").get("/"),
      pause(1),
      exec((session) => session.set("id", "Gatling" + session.userId())),
      ws("Connect WS").connect("/"),
      pause(1),
      repeat(5, "i").on(
        feed(questionsFeeder),
        ws("Customer Question")
          .sendText((session) => session.get("user_question"))
          .await(30).on(
            ws.checkTextMessage("Chatbot Response").check(regex("(.*)")),
          ),
      ),
      pause(1),
      ws("Close WS").close(),
    );

  setUp(
    scn.injectOpen(constantUsersPerSec(usersPerSec).during(durationSeconds)),
  ).protocols(httpProtocol);
});
