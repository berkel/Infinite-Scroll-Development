$(function () {

	var ITEM_HEIGHT = 29;
	var ITEMS_IN_VIEWPORT_COUNT = 6;

	var $wrapper = $(".js-app");

	var is_one_test = /[?&]testId=/.test(location.search);

	function createItemsHtml (items) {
		var str = "";
		_.each(items, function (item, index) {
			str += '<div class="item_wrapper js-item_wrapper" style="height: ' + ITEM_HEIGHT + 'px;" data-id="' + item.id + '"><div class="item" style="background-color: ' + item.color + ';"><div class="item_id">' + item.id + '</div><div class="item_offset">' + index + '</div></div></div>';
		});
		return str;
	}

	function updateWrapperHeight () {
		$wrapper.css("height", Math.max(
			ClientList.$list.prop("scrollHeight"),
			ServerList.$list.prop("scrollHeight")
		) + 200);
	}

	function getRandomInt (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}


	var Commands = function () {
		var _commands = {
			load_next: {
				title: function (server_list_options, loader_options) {
					return "подгружаем с сервера (следующих — " + loader_options.next_load_count + ", предыдущих — " + loader_options.prev_load_count + ")";
				},
				exec: function (client_list) {
					return client_list.loadNext();
				}
			},
			splice: {
				title: function (server_list_options, loader_options, item) {
					return "удалили — " + item.deleteCount + ", добавили — " + item.count + " (с " + item.start + " элемента)";
				},
				exec: function (client_list, server_list, item) {
					return server_list.splice(item.start, item.deleteCount, item.count);
				}
			},
			insert: {
				title: function (server_list_options, loader_options, item) {
					return "добавили — " + item.count + " (с " + item.start + " элемента)";
				},
				exec: function (client_list, server_list, item) {
					return server_list.splice(item.start, 0, item.count);
				}
			},
			delete: {
				title: function (server_list_options, loader_options, item) {
					return "удалили — " + item.count + " (с " + item.start + " элемента)";
				},
				exec: function (client_list, server_list, item) {
					return server_list.splice(item.start, item.count, 0);
				}
			},
			unshift: {
				title: function (server_list_options, loader_options, item) {
					return "добавляем на сервере в начало — " + item.count;
				},
				exec: function (client_list, server_list, item) {
					return server_list.unshift(item.count);
				}
			},
			shift: {
				title: function (server_list_options, loader_options, item) {
					return "удаляем на сервере с начала — " + item.count;
				},
				exec: function (client_list, server_list, item) {
					return server_list.shift(item.count);
				}
			},
			push: {
				title: function (server_list_options, loader_options, item) {
					return "добавляем на сервере в конец — " + item.count;
				},
				exec: function (client_list, server_list, item) {
					return server_list.push(item.count);
				}
			},
			pop: {
				title: function (server_list_options, loader_options, item) {
					return "удаляем на сервере с конца — " + item.count;
				},
				exec: function (client_list, server_list, item) {
					return server_list.pop(item.count);
				}
			}
		};

		var _command_types = [];

		_.each(_commands, function (value, command) {
			_command_types.push(command);
		});

		function exec (client_list, server_list, item) {
			return _commands[item.cmd].exec(client_list, server_list, item);
		}

		function getTitle (server_list_options, loader_options, item) {
			return _commands[item.cmd].title(server_list_options, loader_options, item);
		}

		function getRandom () {
			var index = getRandomInt(0, _command_types.length - 1);
			return create(_command_types[index]);
		}

		function create (cmd) {
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

		return {
			exec: exec,
			getTitle: getTitle,
			getRandom: getRandom,
			create: create
		};
	};


	var Lines = function () {

		var _$window = $(window);

		var _$canvas = $(".js-canvas");

		var _two = new Two().appendTo(_$canvas.get(0));
		var _lines = [];

		function updateGeometry () {
			_two.width = $wrapper.prop("offsetWidth");
			_two.height = $wrapper.prop("offsetHeight");
		}

		function clear () {
			while (_lines.length) {
				_lines.shift().remove();
			}
		}

		function redraw () {

			clear();

			updateGeometry();

			_.each(ClientList.$list.find(".js-item_wrapper"), function (elem) {

				var item = { $elem: $(elem) };
				item.offset = item.$elem.offset();
				item.width = item.$elem.prop("offsetWidth");
				item.height = item.$elem.prop("offsetHeight");
				item.position = { x: item.offset.left + item.width + 2, y: item.offset.top + (item.height / 2)};

				_.each(ServerList.$list.find('.js-item_wrapper[data-id="' + item.$elem.data("id") + '"]'), function (elem) {

					var server_item = { $elem: $(elem) };
					server_item.offset = server_item.$elem.offset();
					server_item.width = server_item.$elem.prop("offsetWidth");
					server_item.height = server_item.$elem.prop("offsetHeight");
					server_item.position = { x: server_item.offset.left - 2, y: server_item.offset.top + (server_item.height / 2)};

					var line = _two.makeLine(item.position.x, item.position.y, server_item.position.x, server_item.position.y);
					line.stroke = "#FEC375";

					_lines.push(line);
				});
			});

			_two.update();
		}

		function onResize () {
			lines.redraw();
		}

		var redrawDebounce = _.debounce(redraw, 5);

		_$window.bind("resize", onResize);

		return {
			redraw: redraw,
			redrawDebounce: redrawDebounce
		};
	};


	var ClientList = (function () {

		var _prev_instance_destroy;

		var _items = [];

		var _$list = $(".js-client_list", $wrapper);
		var _$list_frame = $(".js-client_list_frame", $wrapper);
		var _$list_frame_fake = _$list_frame.find(".js-client_list_placeholder");

		_$list.add(_$list_frame).css("height", ITEMS_IN_VIEWPORT_COUNT * ITEM_HEIGHT);

		function observe () {
			_$list.prop("innerHTML", createItemsHtml(_items));
			updateWrapperHeight();
			lines.redrawDebounce();
			_$list_frame_fake.css("height", _items.length * ITEM_HEIGHT);
		}

		Object.observe(_items, observe);

		function _result (loader) {

			if (_prev_instance_destroy) {
				_prev_instance_destroy();
			}
			_prev_instance_destroy = destroy;

			function getItems () {
				return _items;
			}

			function getIds () {
				return _items.map(function (item) {
					return item.id;
				});
			}

			function getLoader () {
				return loader;
			}

			function loadNext () {
				return loader.getNextItems().done(function (items) {
					_.each(items, function (item) {
						_items.push(item);
					});
				});
			}

			function destroy () {
				_items.length = 0;
			}

			return {
				getItems: getItems,
				getIds: getIds,
				getLoader: getLoader,

				loadNext: loadNext
			};
		}

		_result.$list = _$list;
		_result.$list_frame = _$list_frame;

		return _result;
	})();


	var ServerList = (function () {

		var _prev_instance_destroy;

		var _items = [];

		var _$list = $(".js-server_list", $wrapper);
		var _$list_frame = $(".js-server_list_frame", $wrapper);

		_$list.add(_$list_frame).css("height", ITEMS_IN_VIEWPORT_COUNT * ITEM_HEIGHT);

		function observe () {
			_$list.prop("innerHTML", createItemsHtml(_items));
			updateWrapperHeight();
			lines.redrawDebounce();
		}

		Object.observe(_items, observe);

		function _result (options) {

			if (_prev_instance_destroy) {
				_prev_instance_destroy();
			}
			_prev_instance_destroy = destroy;

			var _START_ITEMS_COUNT = options.start_items_count;

			var _unique_id_counter = 0;

			function getColorByOffset (offset) {
				var colors = ["#FEC375", "#EA8484", "#737610", "#3B8C20", "#FF3002",
					"#9ECEC8", "#CD2158", "#CCB044", "#B4D9EA", "#F350C8"];
				return colors[offset % 10];
			}

			function getUniqueId () {
				return md5(++_unique_id_counter).substr(0, 7);
			}

			function getItems () {
				return _items;
			}

			function getOptions () {
				return options;
			}

			function getRange (start, end) {
				var deferred = new $.Deferred();
				var items = _items.slice(start, end).map(function (item) {
					return _.extend({}, item);
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
				var args = [start, deleteCount];
				while (count--) {
					args.push({ id: getUniqueId(), color: "#0DFCF0" });
				}
				_items.splice.apply(_items, args);
				return new $.Deferred().resolve();
			}

			function unshift (count) {
				while (count--) {
					_items.unshift({ id: getUniqueId(), color: "#F9F637" });
				}
				return new $.Deferred().resolve();
			}

			function push (count) {
				while (count--) {
					_items.push({ id: getUniqueId(), color: "#3EE036" });
				}
				return new $.Deferred().resolve();
			}

			function shift (count) {
				while (count--) {
					_items.shift();
				}
				return new $.Deferred().resolve();
			}

			function pop (count) {
				while (count--) {
					_items.pop();
				}
				return new $.Deferred().resolve();
			}

			function destroy () {
				_items.length = 0;
			}

			var count_items = _START_ITEMS_COUNT;
			while (count_items--) {
				_items.push({ id: getUniqueId(), color: getColorByOffset(count_items) });
			}

			return {
				getItems: getItems,
				getRange: getRange,
				getIds: getIds,
				getOptions: getOptions,

				splice: splice,
				unshift: unshift,
				push: push,
				shift: shift,
				pop: pop
			};
		}

		_result.$list = _$list;
		_result.$list_frame = _$list_frame;

		return _result;
	})();


	var Loader = function (server_list, options) {

		var _PREV_LOAD_COUNT = options.prev_load_count;
		var _NEXT_LOAD_COUNT = options.next_load_count;

		var _current_offset = 0;
		var _ids = {};

		function getFromServer (offset, count) {
//			console.log("getFromServer", "offset:", offset, "count:", count);
			return server_list.getRange(offset, offset + count);
		}

		function addLoadedItems (items, loaded_items) {

			_.each(loaded_items, function (loaded_item) {

//				console.log(loaded_item.id, loaded_item.id in _ids);

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

//			console.log("_current_offset before", _current_offset);

			getFromServer(normalize_offset_for_server, count_for_server).done(function (loaded_items) {

				_current_offset += loaded_items.length - normalize_prev_load_count;

				deferred.resolve(loaded_items, loaded_items.length === count_for_server);

//				console.log("_current_offset after", _current_offset);
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

		function getOptions () {
			return options;
		}

		return {
			getNextItems: getNextItems,
			getOptions: getOptions
		};
	};


	var Waypoint = (function () {

		var _prev_instance_destroy;

		var _$list = ClientList.$list;
		var _$list_frame = ClientList.$list_frame;

		return function (client_list) {

			if (_prev_instance_destroy) {
				_prev_instance_destroy();
			}
			_prev_instance_destroy = destroy;

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
	})();


	var Scenario = (function () {

		var _prev_instance_destroy;

		var _$cases_link = $(".js-command_link");
		var _$cases = $(".js-commands");

		var _steps = [
			  { cmd: "unshift", count: 5 }
			, { cmd: "unshift", count: 10 }
			, { cmd: "push", count: 5 }
			, { cmd: "push", count: 10 }
			, { cmd: "shift", count: 5 }
			, { cmd: "shift", count: 10 }
			, { cmd: "pop", count: 5 }
			, { cmd: "pop", count: 10 }
		];

		return function (client_list, server_list) {

			if (_prev_instance_destroy) {
				_prev_instance_destroy();
			}
			_prev_instance_destroy = destroy;

			var _server_list_options = server_list.getOptions();
			var _loader = client_list.getLoader();
			var _loader_options = _loader.getOptions();

			function runCommand (index) {
				commands.exec(client_list, server_list, _steps[index]);
			}

			function getCommantsHtml () {
				var str = "";
				_.each(_steps, function (item, index) {
					var title = commands.getTitle(_server_list_options, _loader_options, item);
					str += '<div class="command"><span class="command_index">' + (index + 1) + '.</span>' + title + '<span class="command_link js-link" data-index="' + index + '">выполнить</span></div>';
				});
				return str;
			}

			function onLinkMouseOver () {
				_$cases.show();
			}

			function onRunCommandClick (evt) {
				var $target = $(evt.currentTarget);
				var index = $target.data("index");
				runCommand(index);
				_$cases.hide();
			}

			function onLinkMouseLeave () {
				_$cases.hide();
			}

			function destroy () {
				_$cases_link.unbind("mouseover", onLinkMouseOver);
				_$cases
					.unbind("mouseleave", onLinkMouseLeave)
					.undelegate(".js-link", "click", onRunCommandClick)
					.empty();
			}

			_$cases.prop("innerHTML", getCommantsHtml());

			_$cases_link.bind("mouseover", onLinkMouseOver);

			_$cases
				.bind("mouseleave", onLinkMouseLeave)
				.delegate(".js-link", "click", onRunCommandClick);
		}
	})();


	var Tests = function (is_one_test) {

		_.extend(QUnit.config, {
			reorder: false,
			autostart: false
		});

		var _$testContainer = $(".js-qunit");
		var _testHideButton = { $el: $(".js-tests_hide_link") };
		var _allTestsButton = { $el: $(".js-run_saved_tests_link") };
		var _randomTestsButton = { $el: $(".js-run_auto_tests_link") };
		var _oneTestButton = { $el: $(".js-run_one_test_link") };

		var Validator = function () {

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

			function checkLists (assert, factory, load_items) {
				checkDuplicate(assert, factory, load_items);
				checkSpace(assert, factory, load_items);
			}

			return {
				check: checkLists
			};
		};

		var _validator = new Validator();

		function init (server_list_options, loader_options) {
			var server_list = new ServerList(server_list_options);
			var loader = new Loader(server_list, loader_options);
			var client_list = new ClientList(loader);
			var scenario = new Scenario(client_list, server_list);
			var waypoint = new Waypoint(client_list);
			return {
				client_list: client_list,
				server_list: server_list
			};
		}

		function execCommand (factory, item) {
			return commands.exec(factory.client_list, factory.server_list, item);
		}

		function createName (server_list_options, loader_options, steps) {

			var parts = [];

			var settings_parts = [];
			settings_parts.push("на сервере писем — " + server_list_options.start_items_count);
			settings_parts.push("загружаем предыдущих — " + loader_options.prev_load_count);
			settings_parts.push("загружаем следующих — " + loader_options.next_load_count);

			parts.push("Настройки: " + settings_parts.join(", "));

			var steps_parts = [];
			_.each(steps, function (item, index) {
				item.title = createStepName(server_list_options, loader_options, item);
				steps_parts.push("\t" + (index + 1) + ". " +  item.title);
			});

			parts.push("Шаги:\n" + steps_parts.join(";\n"));

			return parts.join(";\n") + ".";
		}

		function createStepName (server_list_options, loader_options, item) {
			return commands.getTitle(server_list_options, loader_options, item);
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
										_validator.check(assert, factory, load_items);
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

		function getRandomCmds () {
			var items = [];

			items.push(commands.create("load_next"));

			var count_commands = getRandomInt(1, 8);
			while (count_commands--) {
				items.push(commands.getRandom());
			}

			items.push(commands.create("load_next"));

			return items;
		}

		function getTests () {
			return JSON.parse(localStorage.getItem("tests"));
		}

		function saveTests (tests) {
			return localStorage.setItem("tests", JSON.stringify(tests));
		}

		function generateTests () {
			var items = [], count_tests = 200;
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
			runSavedTests();
		}

		function runTests (tests) {
			saveTests(tests);

			_.each(tests, function (item) {
				addTest.apply(this, item);
			}, this);

			QUnit.start();
		}

		function runSavedTests () {
			runTests(getTests());
		}

		function runAutoTests () {
			runTests(generateTests());
		}

		function onRunTestsClick () {
			_allTestsButton.disabled = _randomTestsButton.disabled = true;
			_testHideButton.visible = true;
			runSavedTests();
		}

		function onRunAutoTestsClick () {
			_allTestsButton.disabled = _randomTestsButton.disabled = true;
			_testHideButton.visible = true;
			runAutoTests();
		}

		function onTestHideClick () {
			_$testContainer.toggle();
		}

		function runTestButtonObserve (changes) {
			_.each(changes, function (change) {
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
	};

	function createLists () {
		var server_list = new ServerList({
			start_items_count: 42
		});
		var loader = new Loader(server_list, {
			prev_load_count: 9,
			next_load_count: 9
		});
		var client_list = new ClientList(loader);
		var scenario = new Scenario(client_list, server_list);
		var waypoint = new Waypoint(client_list);

		waypoint.run();
	}

	var commands = new Commands();
	var lines = new Lines();
	var tests = new Tests(is_one_test);

	if (!is_one_test) {
		createLists();
	}
});
