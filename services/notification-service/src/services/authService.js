const axios = require("axios");

const getUserContactsByIds = async (userIds = []) => {
  const response = await axios.post(
    `${process.env.AUTH_SERVICE_URL}/internal/users/contacts`,
    { userIds },
    {
      headers: {
        "x-internal-api-key": process.env.INTERNAL_SERVICE_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

module.exports = {
  getUserContactsByIds,
};