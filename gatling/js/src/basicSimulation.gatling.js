/**
 * Gatling simulation script for load testing a WebSocket-based chatbot application.
 *
 * @module basicSimulation.gatling
 */

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

/**
 * Converts a value to a number, returning a fallback if conversion fails.
 *
 * @param {*} value - The value to convert.
 * @param {number} fallback - The fallback value if conversion fails.
 * @returns {number} The converted number or the fallback.
 */
const toNumber = (value, fallback) => {
  // ...
};

/**
 * Derives a WebSocket URL from an HTTP URL, or returns a fallback if invalid.
 *
 * @param {string} httpUrl - The HTTP URL to convert.
 * @param {string} fallback - The fallback WebSocket URL.
 * @returns {string} The derived WebSocket URL or the fallback.
 */
const deriveWebSocketUrl = (httpUrl, fallback) => {
  // ...
};

/**
 * Main Gatling simulation definition.
 *
 * @function
 * @param {Function} setUp - Gatling setup function for configuring injection profiles.
 * @returns {void}
 */
export default simulation((setUp) => {
  /**
   * @constant {string} baseUrl - The base HTTP URL for the application under test.
   */
  const baseUrl = getParameter("baseUrl", "http://localhost:3000");

  /**
   * @constant {string} wsBaseUrl - The base WebSocket URL for the application under test.
   */
  const wsBaseUrl = getParameter(
    "wsBaseUrl",
    deriveWebSocketUrl(baseUrl, "ws://localhost:3000"),
  );

  /**
   * @constant {number} usersPerSec - Number of users per second to inject.
   */
  const usersPerSec = toNumber(getParameter("usersPerSec", "2"), 2);

  /**
   * @constant {number} durationSeconds - Duration of the test in seconds.
   */
  const durationSeconds = toNumber(getParameter("durationSeconds", "15"), 15);

  /**
   * @constant {Feeder} questionsFeeder - Feeder for user questions from a CSV file.
   */
  const questionsFeeder = csv("resources/health_insurance_chatbot_questions.csv").random();

  /**
   * @constant {HttpProtocolBuilder} httpProtocol - HTTP protocol configuration for Gatling.
   */
  const httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
    .doNotTrackHeader("1")
    .acceptLanguageHeader("en-US,en;q=0.5")
    .acceptEncodingHeader("gzip, deflate")
    .userAgentHeader("Gatling2")
    .wsBaseUrl(wsBaseUrl);

  /**
   * @constant {ScenarioBuilder} scn - Scenario definition for WebSocket interaction.
   */
  const scn = scenario("WebSocket")
    .exec(
      /**
       * Sends an HTTP GET request to the home page.
       */
      http("Home").get("/"),
      /**
       * Pauses for 1 second.
       */
      pause(1),
      /**
       * Sets a unique user ID in the session.
       *
       * @param {Session} session - The Gatling session object.
       * @returns {Session} The updated session.
       */
      exec((session) => session.set("id", "Gatling" + session.userId())),
      /**
       * Opens a WebSocket connection.
       */
      ws("Connect WS").connect("/"),
      /**
       * Pauses for 1 second.
      */
      pause(1),
      /**
       * Determines a random number of customer questions for this session.
       *
       * @param {Session} session - The Gatling session object.
       * @returns {Session} The updated session with a random question count.
       */
      exec((session) =>
        session.set("maxQuestions", Math.floor(Math.random() * 10) + 1),
      ),
      /**
       * Repeats sending customer questions and awaiting chatbot responses.
       *
       * @param {number} i - The iteration index.
       */
      repeat((session) => session.get("maxQuestions"), "i").on(
        feed(questionsFeeder),
        /**
         * Sends a user question over WebSocket and awaits a response.
         */
        ws("Customer Question")
          .sendText((session) => session.get("user_question"))
          .await(30).on(
            /**
             * Checks for a chatbot response message matching any text.
             */
            ws.checkTextMessage("Chatbot Response").check(regex("(.*)")),
          ),
      ),
      /**
       * Pauses for 1 second.
       */
      pause(1),
      /**
       * Closes the WebSocket connection.
       */
      ws("Close WS").close(),
    );

  /**
   * Sets up the scenario with the specified injection profile and protocol.
   */
  setUp(
    scn.injectOpen(constantUsersPerSec(usersPerSec).during(durationSeconds)),
  ).protocols(httpProtocol);
});

