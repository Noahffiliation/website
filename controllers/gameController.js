require('dotenv').config();
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_KEY });

exports.game_list = (req, res, next) => {
    blocklist = [];
    async () => {
        const databaseId = process.env.NOTION_DATABASE_ID;
        const response = await notion.databases.query({
            database_id: databaseId,
            page_size: 30,
            filter: {
                property: 'Priority',
                multi_select: {
                    contains: 'Current'
                }
            },
            sorts: [{
                property: 'Name',
                direction: 'ascending'
            }],
        });
        console.log(response.results);
        response.results.forEach(block => {
            async () => {
                const blockId = block.id;
                const blockResponse = await notion.blocks.retrieve({
                    block_id: blockId,
                });
                console.log(blockResponse);
                blocklist.push(blockResponse);
            };
        });
    };
    res.render("games", { title: "Game List", game_list: blocklist });
};

exports.game_detail = (req, res, next) => {

};