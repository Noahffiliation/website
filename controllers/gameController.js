const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_KEY });

exports.gameList = (req, res) => {
	(async () => {
		const databaseId = process.env.NOTION_DATABASE_ID;
		const response = await notion.databases.query({
			database_id: databaseId,
			filter: {
				property: 'Priority',
				multi_select: {
					contains: 'Current',
				},
			},
			sorts: [{
				property: 'Name',
				direction: 'ascending',
			}],
		});
		const games = [];
		response.results.forEach(page => {
			games.push(page);
		});
		res.render('games', { title: 'Games', games: games });
	})();
};

exports.game_detail = (req, res) => {
	(async () => {
		const pageId = req.params.id;
		const response = await notion.pages.retrieve({
			page_id: pageId
		});
		res.render('game_detail', { title: response.properties['Name'].title[0].plain_text, game: response.properties });
	})();
};
