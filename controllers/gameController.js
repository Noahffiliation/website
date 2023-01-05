const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_KEY });

exports.game_list = (req, res, next) => {
    (async () => {
        const databaseId = process.env.NOTION_DATABASE_ID;
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: "Priority",
                multi_select: {
                    contains: "Current"
                }
            },
            sorts: [{
                property: "Name",
                direction: "ascending"
            }]
        });
        let games = [];
        response.results.forEach(page => {
            let game_title = page.properties["Name"].title[0].plain_text
            games.push(game_title);
        });
        res.render('games', { title: "Games", games: games });
      })();
};

exports.game_detail = (req, res, next) => {

};