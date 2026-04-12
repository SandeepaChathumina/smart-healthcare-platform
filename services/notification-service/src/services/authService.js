const axios = require("axios");

const getUserContactsByIds = async (userIds = []) => {
  const response = await axios.post(
    `${process.env.AUTH_SERVICE_URL}/api/auth/internal/users/contacts`,
    { userIds: userIds },
    {
      headers: {
        "x-internal-api-key": process.env.INTERNAL_SERVICE_API_KEY,
      },
    },
  );

  return response.data;
};

module.exports = {
  getUserContactsByIds,
};
