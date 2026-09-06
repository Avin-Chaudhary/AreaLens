const locContHelpers = require("./locControllerHelpers");

const locController = async (req, res) => {
  console.log(req.query);
  const latitude_C = Number(req.query.lat);
  const longitude_C = Number(req.query.lon);
  const distance_radius = Number(req.query.dist);

  /*
  const api_key = Number(req.query.API_KEY);
  if (api_key !== 1234) {
    res.status(400).json({
      status: "failure",
      message: "Invalid API KEY",
    });
  }
  */

  if (![2000, 5000, 10000].includes(distance_radius)) {
    return res.status(400).json({
      status: "failure",
      msgcode: 1011,
      message: "Invalid radius. Allowed: 2000, 5000, 10000",
    });
  }

  try {
    const r1 = await locContHelpers.getCollectedDataOverpass(
      latitude_C,
      longitude_C,
      distance_radius,
      3,
    );

    console.log("1)getCollectedDataOverpass ran fine!!!");

    const r2 = await locContHelpers.processDataOverpass(
      latitude_C,
      longitude_C,
      r1,
    );

    console.log("2)processDataOverpass ran fine!!!");

    const r21 = await locContHelpers.processDataOverpassForChatbot(
      latitude_C,
      longitude_C,
      r1,
    );

    console.log("2.1)processDataOverpassForChatbot ran fine!!!");

    const r3 = await locContHelpers.getCollectedDataAndProcessOwm(
      latitude_C,
      longitude_C,
      r2,
    );

    console.log("3)getCollectedDataAndProcessOwm ran fine!!!");

    const r4 = await locContHelpers.getAreaName(latitude_C, longitude_C);

    console.log("4)getAreaName ran fine!!!");

    const { data_obj: r5, news_summary: sum_news_str } =
      await locContHelpers.getNewsAndUpdateObject(r4, r3);

    console.log("5)getNewsAndUpdateObject ran fine!!!");

    r5.radius_m = distance_radius;

    const r6 = await locContHelpers.getStarRatingsDescription(r5);
    if (sum_news_str != "") {
      r6.overallDescription.news = sum_news_str;
    }

    console.log("6)getStarRatingsDescription ran fine!!!");

    const r7 = await locContHelpers.fitTdata(r5);

    console.log("7)fitTdata ran fine!!!");

    res.status(200).json({
      status: "success",
      data: r5,
      saved_data: r7,
      ratings: r6.ratings,
      description: r6.overallDescription,
      chatbotdata: r21,
    });
  } catch (err) {
    console.error("locController error:", err);

    res.status(400).json({
      status: "failure",
      msgcode: 1110,
      data: {
        message: err.message,
        name: err.name,
      },
    });
  } finally {
    console.log("request handling completed for this request...");
  }
};

module.exports = locController;
