var $ship_list = localStorage['ship_list'];
$ship_list = ($ship_list) ? JSON.parse($ship_list) : {};

chrome.devtools.network.onRequestFinished.addListener(function (request) {
	if (!/^http:\/\/[^\/]+\/kcsapi\/api_(?:get_member\/ship[23]|port\/port)$/.test(request.request.url)) return;

	var ship2 = /ship2$/.test(request.request.url);
	var ship3 = /ship3$/.test(request.request.url);
	var port  = /port$/ .test(request.request.url);

	if (ship3) {
		var params = request.request.postData.params;
		for (var i = 0, param; param = params[i]; i++) {
			if (param.name === 'api%5Fshipid') return;
		}
	}

	request.getContent(function (content) {
		if (!content) return;

		var req = [];
		var json = JSON.parse(content.replace(/^[^=]+=/, ''));
		var data_list = ship2 ? json.api_data               :
		                ship3 ? json.api_data.api_ship_data :
		                port  ? json.api_data.api_ship      : null;
		var deck_list = ship2 ? json.api_data_deck          :
		                ship3 ? json.api_data.api_deck_data :
		                port  ? json.api_data.api_deck_port : null;
		if (!data_list || !deck_list) return;

		var ship_list = {};
		for (var i = 0, data; data = data_list[i]; i++) {
			var ship = $ship_list[data.api_id];
			ship_list[data.api_id.toString(10)] = {
				p_cond: (ship) ? ship.c_cond : 49,
				c_cond: data.api_cond
			};
		}
		$ship_list = ship_list;
		localStorage['ship_list'] = JSON.stringify($ship_list);

		for (var i = 0, deck; deck = deck_list[i]; i++) {
			req.push(deck.api_name);
			var mission_info = deck.api_mission;
			if(mission_info[2]) {
				var rest_time = parseInt((mission_info[2] - (new Date).getTime()) / 1000);
				var rest_seconds = rest_time % 60;
				var rest_minutes = parseInt(rest_time / 60);
				var rest_hours = parseInt(rest_minutes / 60);
				rest_minutes = rest_minutes % 60;
				req.push('遠征中 あと ' + [rest_hours, ('0'+rest_minutes).slice(-2), ('0'+rest_seconds).slice(-2)].join(':'));
			}
			var id_list = deck.api_ship;
			for (var j = 0, id; id = id_list[j]; j++) {
				if (id === -1) break;
				var ship = $ship_list[id.toString(10)];
				var cond = ship.c_cond;
				var diff = cond - ship.p_cond;
				diff = ((diff > 0) ? '+' : '') + diff.toString(10);
				req.push((j + 1).toString(10) + '. ' + cond.toString(10) + ' (' + diff + ')');
			}
		}
		chrome.extension.sendRequest(req);
	});
});

chrome.devtools.network.onRequestFinished.addListener(function (request) {
	if (!/^http:\/\/[^\/]+\/kcsapi\/api_req_map\/(?:start|next)$/.test(request.request.url)) return;
	request.getContent(function (content) {
		if (!content) return;
		var json = JSON.parse(content.replace(/^[^=]+=/, ''));
		if (!json) return;
		if (json.api_data.api_enemy) {
			var enemy_id = json.api_data.api_enemy.api_enemy_id;
			chrome.extension.sendRequest(enemy_id);
		} else if(json.api_data.api_itemget) {
			var item_type_id = json.api_data.api_itemget.api_id;
			var item_amount = json.api_data.api_itemget.api_getcount;
			chrome.extension.sendRequest({
				item_type: item_type_id,
				item_amount: item_amount
			});
		}
	});
});

