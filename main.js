$(function () {

	function addItem ($list, offset, item) {
		function createItem (item, offset) {
			var $item = $('<div class="item_wrapper" style="height: ' + ITEM_HEIGHT + 'px;" data-id="' + item.id + '"><div class="item"><div class="item_id">' + item.id + '</div><div class="item_offset">' + offset + '</div></div></div>');
			$item.find(".item").css("backgroundColor", item.color);
			return $item;
		}
		$list.append(createItem(item, offset));
	}

	function updateWrapperHeight () {
		$wrapper.css("height", Math.max(
			ClientList.$list.prop("scrollHeight"),
			ServerList.$list.prop("scrollHeight")
		) + 200);
	}


	function Lines () {

		var _$window = $(window);

		var _two = new Two().appendTo($("#draw-shapes").get(0));
		var _lines = [];

		function updateGeometry () {
			_two.width = $wrapper.width();
			_two.height = $wrapper.height();
		}

		function clear () {
			while (_lines.length) {
				_lines.shift().remove();
			}
		}

		function redraw () {

			clear();

			updateGeometry();

			$.each(ClientList.$list.find(".item_wrapper"), function () {
				var item = { elem: $(this) };
				item.offset = item.elem.offset();
				item.height = item.elem.prop("offsetHeight");
				item.width = item.elem.prop("offsetWidth");

				$.each(ServerList.$list.find('.item_wrapper[data-id="' + item.elem.data("id") + '"]'), function () {
					var server_item = { elem: $(this) };
					server_item.offset = server_item.elem.offset();
					server_item.height = server_item.elem.prop("offsetHeight");
					server_item.width = server_item.elem.prop("offsetWidth");

					var position1 = { x: item.offset.left + item.width + 2, y: item.offset.top + (item.height / 2)};
					var position2 = { x: server_item.offset.left - 2, y: server_item.offset.top + (server_item.height / 2)};

					var line = _two.makeLine(position1.x, position1.y, position2.x, position2.y);
					line.stroke = "#FEC375";

					_lines.push(line);
				});
			});

			_two.update();
		}

		function onResize () {
			lines.redraw();
		}

		_$window.bind("resize", onResize);

		return {
			redraw: redraw
		};
	}


	function ClientList (loader) {

		if (ClientList.destroy) {
			ClientList.destroy();
		}
		ClientList.destroy = destroy;

		var _items = [];

		var _$list = ClientList.$list;
		var _$list_frame = ClientList.$list_frame;

		_$list.add(_$list_frame).css("height", ITEMS_IN_VIEWPORT_COUNT * ITEM_HEIGHT);

		_$list.empty();

		function observe () {
			_$list.empty();
			_items.forEach(function (item, index) {
				addItem(_$list, index, item);
			});
			updateWrapperHeight();
			lines.redraw();

			_$list_frame.find(".fake").css("height", _items.length * ITEM_HEIGHT);
		}

		function getItems () {
			return _items;
		}

		function getIds () {
			return _items.map(function (item) {
				return item.id;
			});
		}

		function loadNext () {
			return loader.getNextItems().done(function (items) {
				items.forEach(function (item) {
					_items.push(item);
				});
			});
		}

		function destroy () {
			_$list.empty();
			Object.unobserve(_items, observe);
		}

		Object.observe(_items, observe);

		return {
			$list: _$list,
			$list_frame: _$list_frame,

			getItems: getItems,

			getIds: getIds,

			loadNext: loadNext
		};
	}
	ClientList.$list = $(".col_1 .box:eq(0)");
	ClientList.$list_frame = $(".col_1 .box:eq(1)");


	function ServerList (options) {

		if (ServerList.destroy) {
			ServerList.destroy();
		}
		ServerList.destroy = destroy;

		var _START_ITEMS_COUNT = options.start_items_count;

		var _items = [];
		var _unique_id_counter = 0;

		var _$list = ServerList.$list;
		var _$list_frame = ServerList.$list_frame;

		_$list.add(_$list_frame).css("height", ITEMS_IN_VIEWPORT_COUNT * ITEM_HEIGHT);

		_$list.empty();

		function observe () {
			_$list.empty();
			_items.forEach(function (item, index) {
				addItem(_$list, index, item);
			});
			updateWrapperHeight();
			lines.redraw();
		}

		function getColorByOffset (offset) {
			var colors = ["#FEC375", "#D66FDA", "#737610", "#3B8C20", "#FF3002",
				"#CD2158", "#9ECEC8", "#CCB044", "#B4D9EA", "#F350C8"];
			return colors[offset % 10];
		}

		function getUniqueId () {
			return md5(++_unique_id_counter).substr(0, 7);
		}

		function getItems () {
			return _items;
		}

		function getRange (start, end) {
			var deferred = new $.Deferred();
			var items = _items.slice(start, end).map(function (item) {
				return $.extend({}, item);
			});
			setTimeout(function () {
				deferred.resolve(items);
			}, 0);
			return deferred.promise();
		}

		function getIds () {
			return _items.map(function (item) {
				return item.id;
			});
		}

		function splice (start, deleteCount, count) {
			var items = [];
			for (var i=start; i<start + count; i++) {
				items.push({ id: getUniqueId(), color: "#0DFCF0" });
			}
			_items.splice.apply(_items, [start, deleteCount].concat(items));
			return new $.Deferred().resolve();
		}

		function unshift (count) {
			for (var i=0; i<count; i++) {
				_items.unshift({ id: getUniqueId(), color: "#F9F637" });
			}
			return new $.Deferred().resolve();
		}

		function push (count) {
			for (var i=0; i<count; i++) {
				_items.push({ id: getUniqueId(), color: "#3EE036" });
			}
			return new $.Deferred().resolve();
		}

		function shift (count) {
			for (var i=0; i<count; i++) {
				_items.shift();
			}
			return new $.Deferred().resolve();
		}

		function pop (count) {
			for (var i=0; i<count; i++) {
				_items.pop();
			}
			return new $.Deferred().resolve();
		}

		function destroy () {
			_$list.empty();
			Object.unobserve(_items, observe);
		}

		Object.observe(_items, observe);

		for (var i = 0, l = _START_ITEMS_COUNT; i < l; i++) {
			_items.push({ id: getUniqueId(), color: getColorByOffset(i) });
		}

		return {
			$list: _$list,
			$list_frame: _$list_frame,

			getItems: getItems,
			getRange: getRange,
			getIds: getIds,

			splice: splice,
			unshift: unshift,
			push: push,
			shift: shift,
			pop: pop
		};
	}
	ServerList.$list = $(".col_3 .box:eq(0)");
	ServerList.$list_frame = $(".col_3 .box:eq(1)");


	function Loader (server_list, options) {

		var _PREV_LOAD_COUNT = options.prev_load_count;
		var _NEXT_LOAD_COUNT = options.next_load_count;

		var _current_offset = 0;
		var _ids = {};

		function getFromServer (offset, count) {
//				console.log("getFromServer", "offset:", offset, "count:", count);
			return server_list.getRange(offset, offset + count);
		}

		function addLoadedItems (items, loaded_items) {

			loaded_items.forEach(function (loaded_item) {

//					console.log(loaded_item.id, loaded_item.id in _ids);

				if (loaded_item.id in _ids) {

					while (items.length) {
						delete _ids[items.shift().id];
					}

				} else {

					items.push(loaded_item);

					_ids[loaded_item.id] = null;
				}
			});
		}

		function loadItems () {

			var deferred = new $.Deferred();

			var offset_for_server = _current_offset - _PREV_LOAD_COUNT;
			var normalize_offset_for_server = Math.max(0, offset_for_server);
			var normalize_prev_load_count = _PREV_LOAD_COUNT - (normalize_offset_for_server - offset_for_server);
			var count_for_server = normalize_prev_load_count + _NEXT_LOAD_COUNT;

//				console.log("_current_offset before", _current_offset);

			getFromServer(normalize_offset_for_server, count_for_server).done(function (loaded_items) {

				_current_offset += Math.min(count_for_server, loaded_items.length) - normalize_prev_load_count;

				deferred.resolve(loaded_items, loaded_items.length === count_for_server);

//					console.log("_current_offset after", _current_offset);
			});

			return deferred.promise();
		}

		function getItemsTick (deferred, items) {

			loadItems().done(function (loaded_items, has_next) {

				addLoadedItems(items, loaded_items);

				if (has_next && items.length < _NEXT_LOAD_COUNT) {
					getItemsTick(deferred, items);
				} else {
					deferred.resolve(items, has_next);
				}
			});
		}

		function getNextItems () {
			var deferred = new $.Deferred();
			getItemsTick(deferred, []);
			return deferred.promise();
		}

		return {
			getNextItems: getNextItems
		};
	}


	function Waypoint (client_list) {

		if (Waypoint.destroy) {
			Waypoint.destroy();
		}
		Waypoint.destroy = destroy;

		var _$list = client_list.$list;
		var _$list_frame = client_list.$list_frame;

		var _waypoint_options = {
			context: _$list_frame,
			handler: function () {

				client_list.loadNext().done(function (items, has_next) {

					destroyWaypoint();

					if (has_next) {
						_$list_frame.waypoint(_waypoint_options);
					}
				});
			},

			offset: function () {
				var height = _$list_frame.height();
				var offset = _$list_frame.scrollTop();
				var count = client_list.getItems().length;
				return -((count * ITEM_HEIGHT) - height - offset - (ITEM_HEIGHT * 3));
			}
		};

		function run () {
			destroyWaypoint();
			_$list_frame.waypoint(_waypoint_options);
		}

		function onScroll () {
			_$list.css("marginTop", -_$list_frame.scrollTop());
			lines.redraw();
			runDebounce();
		}

		function destroyWaypoint () {
			_$list_frame.waypoint("destroy");
		}

		function destroy () {
			destroyWaypoint();
			_$list_frame.unbind("scroll", onScroll);
		}

		var runDebounce = _.debounce(run, 100);

		_$list_frame.bind("scroll", onScroll);

		return {
			run: run
		};
	}


	function Scenario (server_list) {

		var _$cases_link = $(".cases_link");
		var _$cases = $(".cases");

		var _scenarios = [
			  { add: { prepend: 5 } }
			, { add: { append: 5 } }
			, { add: { prepend: 5, append: 5 } }
			, { add: { prepend: 10 } }
			, { add: { append: 10 } }
			, { add: { prepend: 10, append: 10 } }
			, { remove: { prepend: 5 } }
			, { remove: { append: 5 } }
			, { remove: { prepend: 5, append: 5 } }
			, { remove: { prepend: 10 } }
			, { remove: { append: 10 } }
			, { remove: { prepend: 10, append: 10 } }
		];

		function runScenario (index) {
			var scenario = _scenarios[index];
			if (scenario.add) {
				if (scenario.add.prepend) {
					server_list.unshift(scenario.add.prepend);
				}
				if (scenario.add.append) {
					server_list.push(scenario.add.append);
				}
			}
			if (scenario.remove) {
				if (scenario.remove.prepend) {
					server_list.shift(scenario.remove.prepend);
				}

				if (scenario.remove.append) {
					server_list.pop(scenario.remove.append);
				}
			}
		}

		function addScenario (index, item) {
			var str = [], tmp = [];
			if (item.add) {
				if (item.add.prepend) {
					tmp.push("в начало - " + item.add.prepend);
				}
				if (item.add.append) {
					tmp.push("в конец - " + item.add.append);
				}
				str.push("добавить: " + tmp.join(", "));
			}
			tmp.length = 0;
			if (item.remove) {
				if (item.remove.prepend) {
					tmp.push("с начала - " + item.remove.prepend);
				}
				if (item.remove.append) {
					tmp.push("с конца - " + item.remove.append);
				}
				str.push("удалить: " + tmp.join(", "));
			}
			var $item = $('<div class="scenario"><span class="scenario_num">' + (index + 1) + '.</span>' + str.join("<br/>") + '<span class="scenario_link" data-index="' + index + '">выполнить</span></div>');
			_$cases.append($item);
		}

		_$cases_link.mouseover(function () {
			_$cases.show();
		});

		_$cases.mouseleave(function () {
			_$cases.hide();
		});

		$.each(_scenarios, function (index, item) {
			addScenario(index, item);
		});

		$(".scenario_link").click(function () {
			var index = $(this).data("index");
			runScenario(index);
			_$cases.hide();
		});

		_$cases_link.show();
	}


	function Tests (is_one_test) {

		$.extend(QUnit.config, {
			reorder: false,
			autostart: false
		});

		var _$testContainer = $(".tests .qunit");
		var _testHideButton = { $el: $(".close", _$testContainer) };
		var _allTestsButton = { $el: $(".run-tests button:eq(0)") };
		var _randomTestsButton = { $el: $(".run-tests button:eq(1)") };
		var _oneTestButton = { $el: $(".run-tests button:eq(2)") };

		function Validator () {

			function hasDuplicate (cliens_ids) {
				return cliens_ids.length > _.uniq(cliens_ids).length;
			}

			function hasSpace (load_items_ids, server_ids) {
				var result = false;
				if (load_items_ids.length > 1) {
					var first_load_item = _.first(load_items_ids);
					var last_load_item = _.last(load_items_ids);
					var first_server_item_index = _.indexOf(server_ids, first_load_item);
					var last_server_item_index = _.lastIndexOf(server_ids, last_load_item);
					result = last_server_item_index - first_server_item_index + 1 > load_items_ids.length;
				}
				return result;
			}

			function checkSpace (assert, factory, load_items) {
				var load_items_ids = load_items.map(function (item) { return item.id; });
				var cliens_ids = factory.client_list.getIds();
				var server_ids = factory.server_list.getIds();
				if (hasSpace(load_items_ids, server_ids)) {
					assert.deepEqual(cliens_ids, server_ids, "Не должно быть дыр!");
				} else {
					assert.ok(true, "Нет дыр");
				}
			}

			function checkDuplicate (assert, factory) {
				var cliens_ids = factory.client_list.getIds();
				if (hasDuplicate(cliens_ids)) {
					assert.deepEqual(cliens_ids, _.uniq(cliens_ids), "Не должно быть дубликатов!");
				} else {
					assert.ok(true, "Нет дубликатов");
				}
			}

			function checkLists (assert, factory, load_items, server_list_options, loader_options) {
				checkDuplicate(assert, factory, load_items, server_list_options, loader_options);
				checkSpace(assert, factory, load_items, server_list_options, loader_options);
			}

			return {
				check: checkLists
			};
		}

		var _validator = new Validator();

		var _commands = {

			load_next: {
				title: function (server_list_options, loader_options) {
					return "подгружаем с сервера (следующих — " + loader_options.next_load_count + ", предыдущих — " + loader_options.prev_load_count + ")";
				},
				exec: function (factory) {
					return factory.client_list.loadNext();
				}
			},

			splice: {
				title: function (server_list_options, loader_options, item) {
					return "удалили — " + item.deleteCount + ", добавили — " + item.count + " (с " + item.start + " элемента)";
				},
				exec: function (factory, item) {
					return factory.server_list.splice(item.start, item.deleteCount, item.count);
				}
			},

			insert: {
				title: function (server_list_options, loader_options, item) {
					return "добавили — " + item.count + " (с " + item.start + " элемента)";
				},
				exec: function (factory, item) {
					return factory.server_list.splice(item.start, 0, item.count);
				}
			},

			delete: {
				title: function (server_list_options, loader_options, item) {
					return "удалили — " + item.count + " (с " + item.start + " элемента)";
				},
				exec: function (factory, item) {
					return factory.server_list.splice(item.start, item.count, 0);
				}
			},

			unshift: {
				title: function (server_list_options, loader_options, item) {
					return "добавляем на сервере в начало — " + item.count;
				},
				exec: function (factory, item) {
					return factory.server_list.unshift(item.count);
				}
			},

			shift: {
				title: function (server_list_options, loader_options, item) {
					return "удаляем на сервере с начала — " + item.count;
				},
				exec: function (factory, item) {
					return factory.server_list.shift(item.count);
				}
			},

			push: {
				title: function (server_list_options, loader_options, item) {
					return "добавляем на сервере в конец — " + item.count;
				},
				exec: function (factory, item) {
					return factory.server_list.push(item.count);
				}
			},

			pop: {
				title: function (server_list_options, loader_options, item) {
					return "удаляем на сервере с конца — " + item.count;
				},
				exec: function (factory, item) {
					return factory.server_list.pop(item.count);
				}
			}
		};

		function init (server_list_options, loader_options) {
			var server_list = new ServerList(server_list_options);
			var loader = new Loader(server_list, loader_options);
			var client_list = new ClientList(loader);
			var waypoint = new Waypoint(client_list);
			return {
				client_list: client_list,
				server_list: server_list
			};
		}

		function execCommand (factory, item) {
			return _commands[item.cmd].exec(factory, item);
		}

		function createName (server_list_options, loader_options, steps) {

			var parts = [];

			var settings_parts = [];
			settings_parts.push("на сервере писем — " + server_list_options.start_items_count);
			settings_parts.push("загружаем предыдущих — " + loader_options.prev_load_count);
			settings_parts.push("загружаем следующих — " + loader_options.next_load_count);

			parts.push("Настройки: " + settings_parts.join(", "));

			var steps_parts = [];
			steps.forEach(function (item, index) {
				item.title = createStepName(server_list_options, loader_options, item);
				steps_parts.push("\t" + (index + 1) + ". " +  item.title);
			});

			parts.push("Шаги:\n" + steps_parts.join(";\n"));

			return parts.join(";\n") + ".";
		}

		function createStepName (server_list_options, loader_options, item) {
			return _commands[item.cmd].title(server_list_options, loader_options, item);
		}

		function addTest (server_list_options, loader_options, steps) {

			var name = createName(server_list_options, loader_options, steps);

			QUnit.test(name, function (assert) {

				var factory = init(server_list_options, loader_options);
				var done = assert.async();

				function execNextCommand (first) {
					var item = steps.shift();
					if (item) {

						function doCommand () {
							execCommand(factory, item)
								.done(function (load_items) {

									if (item.cmd === "load_next") {
										_validator.check(assert, factory, load_items, server_list_options, loader_options);
									}

									setTimeout(function () {
										execNextCommand();
									}, 0);
								});
						}

						_oneTestButton.title = item.title;

						if (first || !is_one_test) {
							doCommand();
						} else {
							_oneTestButton.$el.one("click", doCommand);
						}

					} else {

						done();

						if (is_one_test) {
							_oneTestButton.disabled = true;
						}
					}
				}
				execNextCommand(true);
			});
		}

		function getRandomInt (min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}

		function createCmd (cmd) {
			var item = { cmd: cmd };
			if (_.indexOf(["unshift", "shift", "push", "pop"], item.cmd) !== -1) {
				item.count = getRandomInt(0, 30);
			} else if (item.cmd === "splice") {
				item.start = getRandomInt(0, 30);
				item.deleteCount = getRandomInt(0, 30);
				item.count = getRandomInt(0, 30);
			} else if (item.cmd === "insert" || item.cmd === "delete") {
				item.start = getRandomInt(1, 30);
				item.count = getRandomInt(1, 30);
			}
			return item;
		}

		function getRandomCmds () {
			var items = [], map = [];

			items.push(createCmd("load_next"));

			_.each(_commands, function (value, command) {
				map.push(command);
			});

			var count_commands = getRandomInt(1, 8);
			while (count_commands--) {
				var index = getRandomInt(0, map.length - 1);
				items.push(createCmd(map[index]));
			}

			items.push(createCmd("load_next"));

			return items;
		}

		function getTests () {
			return JSON.parse(localStorage.getItem("tests"));
		}

		function saveTests (tests) {
			return localStorage.setItem("tests", JSON.stringify(tests));
		}

		function generateTests () {
			var items = [], count_tests = 500;
			while (count_tests--) {
				items.push([
					  { start_items_count: getRandomInt(0, 100) }
					, { prev_load_count: getRandomInt(0, 100), next_load_count: getRandomInt(0, 100) }
					, getRandomCmds()
				]);
			}
			return items;
		}

		function runOneTest () {
			runTests();
		}

		function runTests () {
			var tests = getTests() || generateTests();
			saveTests(tests);

			tests.forEach(function (item) {
				addTest.apply(this, item);
			}, this);

			QUnit.start();
		}

		function runAutoTests () {
			var tests = generateTests();
			saveTests(tests);

			tests.forEach(function (item) {
				addTest.apply(this, item);
			}, this);

			QUnit.start();
		}

		function onRunTestsClick () {
			_allTestsButton.disabled = _randomTestsButton.disabled = true;
			_testHideButton.visible = true;
			runTests();
		}

		function onRunAutoTestsClick () {
			_allTestsButton.disabled = _randomTestsButton.disabled = true;
			_testHideButton.visible = true;
			runAutoTests();
		}

		function onTestHideClick () {
			_$testContainer.hide();
		}

		function runTestButtonObserve (changes) {
			changes.forEach(function (change) {
				var item = change.object;
				if (change.name === "disabled") {
					if (item.disabled) {
						item.$el.attr("disabled", "disabled");
					} else {
						item.$el.removeAttr("disabled");
					}
				} else if (change.name === "title") {
					item.$el.text(item.title);
				} else if (change.name === "visible") {
					item.$el.toggle(item.visible);
				}
			});
		}

		Object.observe(_testHideButton, runTestButtonObserve);
		Object.observe(_allTestsButton, runTestButtonObserve);
		Object.observe(_randomTestsButton, runTestButtonObserve);
		Object.observe(_oneTestButton, runTestButtonObserve);

		if (is_one_test) {

			runOneTest();

			_oneTestButton.disabled = false;
			_testHideButton.visible = true;

		} else {

			if (getTests()) {
				_allTestsButton.$el.bind("click", onRunTestsClick);
				_allTestsButton.disabled = false;
			}

			_randomTestsButton.$el.bind("click", onRunAutoTestsClick);
			_randomTestsButton.disabled = false;
		}

		_testHideButton.$el.bind("click", onTestHideClick);
	}


	var ITEM_HEIGHT = 29;
	var ITEMS_IN_VIEWPORT_COUNT = 6;

	var $wrapper = $(".wrapper");

	var is_one_test = /[?&]testId=/.test(location.search);

	var lines = new Lines();
	var tests = new Tests(is_one_test);

	if (!is_one_test) {

		var server_list = new ServerList({
			start_items_count: 42
		});
		var loader = new Loader(server_list, {
			prev_load_count: 9,
			next_load_count: 9
		});
		var client_list = new ClientList(loader);
		var scenario = new Scenario(server_list);
		var waypoint = new Waypoint(client_list);

		waypoint.run();
	}
});
