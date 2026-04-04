const axios = require("axios");

const sendSMS = async ({ to, message }) => {
  try {
    const response = await axios.post(
      `${process.env.INFOBIP_BASE_URL}/sms/2/text/advanced`,
      {
        messages: [
          {
            from: process.env.INFOBIP_SENDER_ID,
            destinations: [{ to }],
            text: message,
          },
        ],
      },
      {
        headers: {
          Authorization: `App ${process.env.INFOBIP_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.requestError?.serviceException?.text ||
        error.response?.data?.message ||
        error.message ||
        "SMS sending failed"
    );
  }
};

module.exports = sendSMS;