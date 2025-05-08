const ANILIST_API = "https://graphql.anilist.co";

async function fetchFromAniList(query, variables = {}) {
  const { request } = await import("graphql-request");

  const data = await request(ANILIST_API, query, variables);
  return data;
}

module.exports = { fetchFromAniList };
