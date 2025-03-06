/*!
 * roundSlider v1.4.0 | (c) 2015-2020, Soundar
 * MIT license | http://roundsliderui.com/licence.html
 */

(function ($, window, undefined) {
    "use strict";
    /*jslint nomen: true */

    var pluginName = "roundSlider";

    // The plugin initialization
    $.fn[pluginName] = function (options) {
        return CreateRoundSlider.call(this, options, arguments);
    };

    RoundSlider.prototype = {

        pluginName: pluginName,
        version: "1.4.0",

        // after the control initialization the updated default values
        // are merged into the options
        options: {},

        // holds the current roundSlider element
        control: null,

        // default properties of the plugin. while add a new property,
        // that type should be included in the "_props:" for validation
        defaults: {
            min: 0,
            max: 100,
            step: 1,
            value: null,
            radius: 85,
            width: 18,
            handleSize: "+0",
            startAngle: 0,
            endAngle: "+360",
            animation: true,
            showTooltip: true,
            editableTooltip: true,
            readOnly: false,
            disabled: false,
            keyboardAction: true,
            mouseScrollAction: false,
            lineCap: "butt",
            sliderType: "default",
            circleShape: "full",
            handleShape: "round",

            // SVG related properties
            svgMode: false,
            borderWidth: 1,
            borderColor: null,
            pathColor: null,
            rangeColor: null,

            // events
            beforeCreate: null,
            create: null,
            start: null,
            drag: null,
            change: null,
            stop: null,
            tooltipFormat: null
        },
        keys: {     // key codes for
            UP: 38,     // up arrow
            DOWN: 40,   // down arrow
            LEFT: 37,   // left arrow
            RIGHT: 39   // right arrow
        },
        _props: function () {
            return {
                numberType: ["min", "max", "step", "radius", "width", "borderWidth", "startAngle"],
                booleanType: ["animation", "showTooltip", "editableTooltip", "readOnly", "disabled",
                    "keyboardAction", "mouseScrollAction", "svgMode"],
                stringType: ["sliderType", "circleShape", "handleShape", "lineCap"]
            };
        },
        
        _init: function () {
            if (this.options.svgMode) {
                var EMPTY_FUNCTION = function () {}; 
                this._appendSeperator = EMPTY_FUNCTION;
                this._refreshSeperator = EMPTY_FUNCTION;
                this._updateSeperator = EMPTY_FUNCTION;
                this._appendOverlay = EMPTY_FUNCTION;
                this._checkOverlay = EMPTY_FUNCTION;
                this._updateWidth = EMPTY_FUNCTION;
            }

            this._isBrowserSupport = this._isBrowserSupported();
            this._isKO = false;
            this._isAngular = false;
            if (this.control.is("input")) {
                this._isInputType = true;
                this._hiddenField = this.control;
                this.control = this.$createElement("div");
                this.control.insertAfter(this._hiddenField);
                this.options.value = this._hiddenField.val() || this.options.value;
                var that = this;
                this._checkKO() && setTimeout(function () { that._checkKO(); }, 1);
                this._checkAngular();
            }
            this._bindOnDrag = false;
            var _updateOn = this._dataElement().attr("data-updateon");
            if (typeof _updateOn == "string") { if (_updateOn == "drag") this._bindOnDrag = true; }
            else if (this._isAngular) this._bindOnDrag = true;

            this._onInit();
        },
        _onInit: function () {
            this._initialize();
            this._update();
            this._render();
        },
        _initialize: function () {
            var browserName = this.browserName = this.getBrowserName();
            if (browserName) this.control.addClass("rs-" + browserName);
            if (!this._isBrowserSupport) return;
            this._isReadOnly = false;
            this._checkDataType();
            this._refreshCircleShape();
        },
        _render: function () {
            this.container = this.$createElement("div.rs-container");
            this.innerContainer = this.$createElement("div.rs-inner-container");
            this.container.append(this.innerContainer);
            var $rootCSS = "rs-control " + (this.options.svgMode ? "rs-svg-mode" : "rs-classic-mode");
            this.control.addClass($rootCSS).empty().append(this.container);

            if (this._isBrowserSupport) {
                this._createLayers();
                this._createOtherLayers();
                this._setContainerClass();
                this._setRadius();
                this._setProperties();
                this._setValue();
                this._updateTooltipPos();
                this._bindControlEvents("_bind");
            }
            else {
                var msg = this.$createElement("div.rs-msg");
                msg.html(typeof this._throwError === "function" ? this._throwError() : this._throwError);
                this.control.empty().addClass("rs-error").append(msg);
                if (this._isInputType) this.control.append(this._dataElement());
            }
        },
        _update: function () {
            this._validateSliderType();
            this._updateStartEnd();
            this._validateStartEnd();
            this._handle1 = this._handle2 = this._handleDefaults();
            this._analyzeModelValue();
            this._validateModelValue();
        },
        _createLayers: function () {
            if(this.options.svgMode) {
                this._createSVGElements();
                this._setSVGAttributes();
                this._setSVGStyles();
                this._moveSliderRange(true);
                return;
            }

            this.block = this.$createElement("div.rs-block rs-outer rs-border");
            this.innerContainer.append(this.block);

            var padd = this.options.width, start = this._start, path;
            path = this.$createElement("div.rs-path rs-transition");

            if (this._rangeSlider || this._showRange) {
                this.block1 = path.clone().addClass("rs-range-color").rsRotate(start);
                this.block2 = path.clone().addClass("rs-range-color").css("opacity", "0").rsRotate(start);
                this.block3 = path.clone().addClass("rs-path-color").rsRotate(start);
                this.block4 = path.addClass("rs-path-color").css({ "opacity": "1", "z-index": "1" }).rsRotate(start - 180);

                this.block.append(this.block1, this.block2, this.block3, this.block4).addClass("rs-split");
            }
            else this.block.append(path.addClass("rs-path-color"));

            this.lastBlock = this.$createElement("span.rs-block").css({ "padding": padd });
            this.innerBlock = this.$createElement("div.rs-inner rs-bg-color rs-border");
            this.lastBlock.append(this.innerBlock);
            this.block.append(this.lastBlock);
        },
        _createOtherLayers: function () {
            this._appendHandle();
            this._appendSeperator();    // non SVG mode only
            this._appendOverlay();      // non SVG mode only
            this._appendHiddenField();
        },
        _setProperties: function () {
            this._updatePre();
            this._setHandleShape();
            this._addAnimation();
            this._appendTooltip();
            if (!this.options.showTooltip) this._removeTooltip();
            if (this.options.disabled) this.disable();
            else if (this.options.readOnly) this._readOnly(true);
            if (this.options.mouseScrollAction) this._bindScrollEvents("_bind");
        },
        _updatePre: function () {
            this._prechange = this._predrag = this.options.value;
        },
        _setValue: function () {
            if (this._rangeSlider) {
                this._setHandleValue(1);
                this._setHandleValue(2);
            }
            else {
                if (this._showRange) this._setHandleValue(1);
                var index = (this.options.sliderType == "default") ? (this._active || 1) : parseFloat(this.bar.children().attr("index"));
                this._setHandleValue(index);
            }
        },
        _appendTooltip: function () {
            if (this.container.children(".rs-tooltip").length !== 0) return;
            this.tooltip = this.$createElement("span.rs-tooltip rs-tooltip-text");
            this.container.append(this.tooltip);
            this._tooltipEditable();
            this._updateTooltip();
        },
        _removeTooltip: function () {
            if (this.container.children(".rs-tooltip").length == 0) return;
            this.tooltip && this.tooltip.remove();
        },
        _tooltipEditable: function () {
            var o = this.options, tooltip = this.tooltip, hook;
            if (!tooltip || !o.showTooltip) return;

            if (o.editableTooltip) {
                tooltip.addClass("edit");
                hook = "_bind";
            }
            else {
                tooltip.removeClass("edit");
                hook = "_unbind";
            }
            this[hook](tooltip, "click", this._editTooltip);
        },
        _editTooltip: function (e) {
            var tooltip = this.tooltip;
            if (!tooltip.hasClass("edit") || this._isReadOnly) return;
            var border = parseFloat(tooltip.css("border-left-width")) * 2;
            var input = this.input = this.$createElement("input.rs-input rs-tooltip-text").css({
                height: tooltip.outerHeight() - border,
                width: tooltip.outerWidth() - border
            });
            tooltip.html(input).removeClass("edit").addClass("hover");

            input.focus().val(this._getTooltipValue(true));

            this._bind(input, "blur", this._focusOut);
            this._bind(input, "change", this._focusOut);
        },
        _focusOut: function (e) {
            if (e.type == "change") {
                var val = this.input.val().replace("-", ",");
                if (val[0] == ",") {
                    val = "-" + val.slice(1).replace("-", ",");
                }
                this.options.value = val;
                this._analyzeModelValue();
                this._validateModelValue();
                this._setValue();
                this.input.val(this._getTooltipValue(true));
            }
            else {
                this.tooltip.addClass("edit").removeClass("hover");
                this._updateTooltip();
            }
            this._raiseEvent("change");
        },
        _setHandleShape: function () {
            var type = this.options.handleShape, allHandles = this._handles();
            allHandles.removeClass("rs-handle-dot rs-handle-square");
            if (type == "dot") allHandles.addClass("rs-handle-dot");
            else if (type == "square") allHandles.addClass("rs-handle-square");
            else this.options.handleShape = "round";
        },
        _setHandleValue: function (index) {
            this._active = index;
            var handle = this["_handle" + index];
            if (this.options.sliderType != "min-range") this.bar = this._activeHandleBar();
            this._changeSliderValue(handle.value, handle.angle);
        },
        _setAnimation: function () {
            if (this.options.animation) this._addAnimation();
            else this._removeAnimation();
        },
        _addAnimation: function () {
            if (this.options.animation) this.control.addClass("rs-animation");
        },
        _removeAnimation: function () {
            this.control.removeClass("rs-animation");
        },
        _setContainerClass: function () {
            var circleShape = this.options.circleShape;
            if (circleShape == "full" || circleShape == "pie" || circleShape.indexOf("custom") === 0) {
                this.container.addClass("full " + circleShape);
            }
            else {
                this.container.addClass(circleShape.split("-").join(" "));
            }
        },
        _setRadius: function () {
            var o = this.options, r = o.radius, d = r * 2, circleShape = o.circleShape;
            var extraSize = 0, actualHeight, actualWidth;
            var height = actualHeight = d, width = actualWidth = d;

            // whenever the radius changes, before update the container size
            // check for the lineCap also, since that will make some additional size
            // also, based on that need to align the handle bars
            var isFullCircle = (circleShape == "full" || circleShape == "pie" || circleShape.indexOf("custom") === 0);
            if (o.svgMode && !isFullCircle) {
                var handleBars = this._handleBars();
                if (o.lineCap != "none") {
                    extraSize = (o.lineCap === "butt") ? (o.borderWidth / 2) : ((o.width / 2) + o.borderWidth);
                    if (circleShape.indexOf("bottom") != -1) {
                        handleBars.css("margin-top", extraSize + 'px');
                    }
                    if (circleShape.indexOf("right") != -1) {
                        handleBars.css("margin-right", -extraSize + 'px');
                    }
                }
                else {
                    // when lineCap none, then remove the styles that was set previously for the other lineCap props
                    $.each(handleBars, function(i, bar) {
                        bar.style.removeProperty("margin-top");
                        bar.style.removeProperty("margin-right");
                    });
                }
            }

            if (circleShape.indexOf("half") === 0) {
                switch (circleShape) {
                    case "half-top":
                    case "half-bottom":
                        height = r; actualHeight = r + extraSize;
                        break;
                    case "half-left":
                    case "half-right":
                        width = r; actualWidth = r + extraSize;
                        break;
                }
            }
            else if (circleShape.indexOf("quarter") === 0) {
                height = width = r;
                actualHeight = actualWidth = r + extraSize;
            }

            this.container.css({ "height": height, "width": width });
            this.control.css({ "height": actualHeight, "width": actualWidth });

            // when needed, then only we can set the styles through script, otherwise CSS styles applicable
            if (extraSize !== 0) this.innerContainer.css({ "height": actualHeight, "width": actualWidth });
            else this.innerContainer.removeAttr("style");

            if (o.svgMode) {
                this.svgContainer.height(d).width(d);
                this.svgContainer.children("svg").height(d).width(d);
            }
        },
        _border: function (seperator) {
            if (seperator) return parseFloat(this._startLine.children().css("border-bottom-width"));
            if (this.options.svgMode) return this.options.borderWidth * 2;
            return parseFloat(this.block.css("border-top-width")) * 2;
        },
        _appendHandle: function () {
            if (this._rangeSlider || !this._showRange) this._createHandle(1);
            if (this._rangeSlider || this._showRange) this._createHandle(2);
        },
        _appendSeperator: function () {
            this._startLine = this._addSeperator(this._start, "rs-start");
            this._endLine = this._addSeperator(this._start + this._end, "rs-end");
            this._refreshSeperator();
        },
        _addSeperator: function (pos, cls) {
            var line = this.$createElement("span.rs-seperator rs-border"), width = this.options.width, _border = this._border();
            var lineWrap = this.$createElement("span.rs-bar rs-transition " + cls).append(line).rsRotate(pos);
            this.container.append(lineWrap);
            return lineWrap;
        },
        _refreshSeperator: function () {
            var bars = this._startLine.add(this._endLine), seperators = bars.children().removeAttr("style");
            var o = this.options, width = o.width, _border = this._border(), size = width + _border;
            if (o.lineCap == "round" && o.circleShape != "full") {
                bars.addClass("rs-rounded");
                seperators.css({ width: size, height: (size / 2) + 1 });
                this._startLine.children().css("margin-top", -1).addClass(o.sliderType == "min-range" ? "rs-range-color" : "rs-path-color");
                this._endLine.children().css("margin-top", size / -2).addClass("rs-path-color");
            }
            else {
                bars.removeClass("rs-rounded");
                seperators.css({ "width": size, "margin-top": this._border(true) / -2 }).removeClass("rs-range-color rs-path-color");
            }
        },
        _updateSeperator: function () {
            this._startLine.rsRotate(this._start);
            this._endLine.rsRotate(this._start + this._end);
        },
        _createHandle: function (index) {
            var handle = this.$createElement("div.rs-handle rs-move"), o = this.options, hs;
            if ((hs = o.handleShape) != "round") handle.addClass("rs-handle-" + hs);
            handle.attr({ "index": index, "tabIndex": "0" });

            var id = this._dataElement()[0].id, id = id ? id + "_" : "";
            var label = id + "handle" + (o.sliderType == "range" ? "_" + (index == 1 ? "start" : "end") : "");
            handle.attr({ "role": "slider", "aria-label": label });     // WAI-ARIA support

            var bar = this.$createElement("div.rs-bar rs-transition").css("z-index", "7").append(handle).rsRotate(this._start);
            bar.addClass(o.sliderType == "range" && index == 2 ? "rs-second" : "rs-first");
            this.container.append(bar);
            this._refreshHandle();

            this.bar = bar;
            this._active = index;
            if (index != 1 && index != 2) this["_handle" + index] = this._handleDefaults();
            this._bind(handle, "focus", this._handleFocus);
            this._bind(handle, "blur", this._handleBlur);
            return handle;
        },
        _refreshHandle: function () {
            var o = this.options, hSize = o.handleSize, width = o.width, h, w, isSquare = true, isNumber = this.isNumber;
            if (typeof hSize === "string" && isNumber(hSize)) {
                if (hSize.charAt(0) === "+" || hSize.charAt(0) === "-") {
                    try { hSize = eval(width + hSize.charAt(0) + Math.abs(parseFloat(hSize))); }
                    catch (e) { console.warn(e); }
                }
                else if (hSize.indexOf(",")) {
                    var s = hSize.split(",");
                    if (isNumber(s[0]) && isNumber(s[1])) w = parseFloat(s[0]), h = parseFloat(s[1]), isSquare = false;
                }
            }
            if (isSquare) h = w = isNumber(hSize) ? parseFloat(hSize) : width;
            var diff = (width + this._border() - w) / 2;
            this._handles().css({ height: h, width: w, "margin": -h / 2 + "px 0 0 " + diff + "px" });
        },
        _handleDefaults: function () {
            var min = this.options.min;
            return { angle: this._valueToAngle(min), value: min };
        },
        _handleBars: function () {
            return this.container.children("div.rs-bar");
        },
        _handles: function () {
            return this._handleBars().find(".rs-handle");
        },
        _activeHandleBar: function (index) {
            index = (index != undefined) ? index : this._active;
            return $(this._handleBars()[index - 1]);
        },
        _handleArgs: function (index) {
            index = (index != undefined) ? index : this._active;
            var _handle = this["_handle" + index];
            return {
                element: this._activeHandleBar(index).children(),
                index: index,
                isActive: index == this._active,
                value: _handle ? _handle.value : null,
                angle: _handle ? _handle.angle : null
            };
        },
        _dataElement: function () {
            return this._isInputType ? this._hiddenField : this.control;
        },
        _raiseEvent: function (event) {
            var preValue = this["_pre" + event], currentValue = this.options.value;
            if (preValue !== currentValue) {
                this["_pre" + event] = currentValue;
                if (event == "change") this._updatePre();
                this._updateTooltip();
                if ((event == "change") || (this._bindOnDrag && event == "drag")) this._updateHidden();
                return this._raise(event, { value: currentValue, preValue: preValue, "handle": this._handleArgs() });
            }
        },

        // Events handlers
        _elementDown: function (e) {
            if (this._isReadOnly) return;
            var $target = $(e.target);

            if ($target.hasClass("rs-handle")) {
                this._handleDown(e);
            }
            else {
                var point = this._getXY(e), center = this._getCenterPoint();
                var distance = this._getDistance(point, center);
                var block = this.block || this.svgContainer;
                var outerDistance = block.outerWidth() / 2;
                var innerDistance = outerDistance - (this.options.width + this._border());

                if (distance >= innerDistance && distance <= outerDistance) {
                    var handle = this.control.find(".rs-handle.rs-focus"), angle, value;
                    if (handle.length !== 0) {
                        // here, some handle was in already focused state, and user clicked on the slider path
                        // so this will make the handle unfocus, to avoid that we can prevent this event
                        e.preventDefault();
                    }
                    
                    var d = this._getAngleValue(point, center);
                    angle = d.angle, value = d.value;

                    if (this._rangeSlider) {
                        if (handle.length == 1) this._active = parseFloat(handle.attr("index"));
                        else this._active = (this._handle2.value - value) < (value - this._handle1.value) ? 2 : 1;
                        this.bar = this._activeHandleBar();
                    }

                    this._changeSliderValue(value, angle);
                    this._raiseEvent("change");
                }
            }
        },
        _handleDown: function (e) {
            e.preventDefault();
            var $target = $(e.target);
            $target.focus();
            this._removeAnimation();
            this._bindMouseEvents("_bind");
            this.bar = $target.parent();
            this._active = parseFloat($target.attr("index"));
            this._handles().removeClass("rs-move");
            this._raise("start", { value: this.options.value, "handle": this._handleArgs() });
        },
        _handleMove: function (e) {
            e.preventDefault();
            var point = this._getXY(e), center = this._getCenterPoint();
            var d = this._getAngleValue(point, center, true), angle, value;
            angle = d.angle, value = d.value;

            this._changeSliderValue(value, angle);
            this._raiseEvent("drag");
        },
        _handleUp: function (e) {
            this._handles().addClass("rs-move");
            this._bindMouseEvents("_unbind");
            this._addAnimation();
            this._raiseEvent("change");
            this._raise("stop", { value: this.options.value, "handle": this._handleArgs() });
        },
        _handleFocus: function (e) {
            if (this._isReadOnly) return;
            var $target = $(e.target);
            this._handles().removeClass("rs-focus");
            $target.addClass("rs-focus");
            this.bar = $target.parent();
            this._active = parseFloat($target.attr("index"));
            if (this.options.keyboardAction) {
                this._bindKeyboardEvents("_unbind");
                this._bindKeyboardEvents("_bind");
            }

            // updates the class for change z-index
            this.control.find("div.rs-bar").css("z-index", "7");
            this.bar.css("z-index", "8");
        },
        _handleBlur: function (e) {
            this._handles().removeClass("rs-focus");
            if (this.options.keyboardAction) this._bindKeyboardEvents("_unbind");
        },
        _handleKeyDown: function (e) {
            if (this._isReadOnly) return;
            var key = e.keyCode, keyCodes = this.keys;
            
            if (key == 27)                                      // if Esc key pressed then hanldes will be focused out
                this._handles().blur();

            if (!(key >= 35 && key <= 40)) return;              // if not valid keys, then return
            if (key >= 37 && key <= 40) this._removeAnimation();

            var h = this["_handle" + this._active], val, ang;

            e.preventDefault();
            if (key == keyCodes.UP || key == keyCodes.RIGHT)                                // Up || Right Key
                val = this._round(this._limitValue(h.value + this.options.step));
            else if (key == keyCodes.DOWN || key == keyCodes.LEFT)                          // Down || Left Key
                val = this._round(this._limitValue(h.value - this._getMinusStep(h.value)));
            else if (key == 36)                                                             // Home Key
                val = this._getKeyValue("Home");
            else if (key == 35)                                                             // End Key
                val = this._getKeyValue("End");

            ang = this._valueToAngle(val);
            this._changeSliderValue(val, ang);
            this._raiseEvent("drag");
        },
        _handleKeyUp: function (e) {
            this._addAnimation();
            this._raiseEvent("change");
        },
        _getMinusStep: function (val) {
            var o = this.options, min = o.min, max = o.max, step = o.step;
            if (val == max) {
                var remain = (max - min) % step;
                return remain == 0 ? step : remain;
            }
            return step;
        },
        _getKeyValue: function (key) {
            var o = this.options, min = o.min, max = o.max;
            if (this._rangeSlider) {
                if (key == "Home") return (this._active == 1) ? min : this._handle1.value;
                else return (this._active == 1) ? this._handle2.value : max;
            }
            return (key == "Home") ? min : max;
        },
        _elementScroll: function (event) {
            if (this._isReadOnly) return;
            event.preventDefault();
            var e = event.originalEvent || event, h, val, ang, delta;
            delta = e.wheelDelta ? e.wheelDelta / 60 : (e.detail ? -e.detail / 2 : 0);
            if (delta == 0) return;

            this._updateActiveHandle(event);
            h = this["_handle" + this._active];
            val = h.value + (delta > 0 ? this.options.step : -this._getMinusStep(h.value));
            val = this._limitValue(val);
            ang = this._valueToAngle(val);

            this._removeAnimation();
            this._changeSliderValue(val, ang);
            this._raiseEvent("change");
            this._addAnimation();
        },
        _updateActiveHandle: function (e) {
            var $target = $(e.target);
            if ($target.hasClass("rs-handle") && $target.parent().parent()[0] == this.control[0]) {
                this.bar = $target.parent();
                this._active = parseFloat($target.attr("index"));
            }
            if (!this.bar.find(".rs-handle").hasClass("rs-focus")) this.bar.find(".rs-handle").focus();
        },

        // Events binding
        _bindControlEvents: function (hook) {
            this[hook](this.control, "mousedown", this._elementDown);
            this[hook](this.control, "touchstart", this._elementDown);
        },
        _bindScrollEvents: function (hook) {
            this[hook](this.control, "mousewheel", this._elementScroll);
            this[hook](this.control, "DOMMouseScroll", this._elementScroll);
        },
        _bindMouseEvents: function (hook) {
            this[hook]($(document), "mousemove", this._handleMove);
            this[hook]($(document), "mouseup", this._handleUp);
            this[hook]($(document), "mouseleave", this._handleUp);

            // *** for Touch support *** //
            this[hook]($(document), "touchmove", this._handleMove);
            this[hook]($(document), "touchend", this._handleUp);
            this[hook]($(document), "touchcancel", this._handleUp);
        },
        _bindKeyboardEvents: function (hook) {
            this[hook]($(document), "keydown", this._handleKeyDown);
            this[hook]($(document), "keyup", this._handleKeyUp);
        },

        // internal methods
        _changeSliderValue: function (value, angle) {
            var oAngle = this._oriAngle(angle), lAngle = this._limitAngle(angle);
            if (!this._rangeSlider && !this._showRange) {

                this["_handle" + this._active] = { angle: angle, value: value };
                this.options.value = value;
                this.bar.rsRotate(lAngle);
                this._updateARIA(value);
            }
            else if ((this._active == 1 && oAngle <= this._oriAngle(this._handle2.angle)) ||
                    (this._active == 2 && oAngle >= this._oriAngle(this._handle1.angle)) || this._invertRange) {

                this["_handle" + this._active] = { angle: angle, value: value };
                this.options.value = this._rangeSlider ? this._handle1.value + "," + this._handle2.value : value;
                this.bar.rsRotate(lAngle);
                this._updateARIA(value);

                if (this.options.svgMode) {
                    this._moveSliderRange();
                    return;
                }

                // classic DIV handling
                var dAngle = this._oriAngle(this._handle2.angle) - this._oriAngle(this._handle1.angle), o2 = "1", o3 = "0";
                if (dAngle <= 180 && !(dAngle < 0 && dAngle > -180)) o2 = "0", o3 = "1";
                this.block2.css("opacity", o2);
                this.block3.css("opacity", o3);

                (this._active == 1 ? this.block4 : this.block2).rsRotate(lAngle - 180);
                (this._active == 1 ? this.block1 : this.block3).rsRotate(lAngle);
            }
        },

        // SVG related functionalities
        _createSVGElements: function () {
            var svgEle = this.$createSVG("svg");
            var PATH = "path.rs-transition ";
            var pathAttr = { fill: "transparent" };

            this.$path = this.$createSVG(PATH + "rs-path", pathAttr);
            this.$range = this._showRange ? this.$createSVG(PATH + "rs-range", pathAttr) : null;
            this.$border = this.$createSVG(PATH + "rs-border", pathAttr);
            this.$append(svgEle, [this.$path, this.$range, this.$border]);

            this.svgContainer = this.$createElement("div.rs-svg-container").append(svgEle);
            this.innerContainer.append(this.svgContainer);
        },
        _setSVGAttributes: function () {
            var o = this.options, radius = o.radius, 
                border = o.borderWidth, width = o.width,
                lineCap = o.lineCap;
            var outerRadius = radius - (border / 2),
                innerRadius = outerRadius - width - border;
            var startAngle = this._start,
                totalAngle = this._end,
                endAngle = startAngle + totalAngle;

            // draw the path for border element
            var border_d = this.$drawPath(radius, outerRadius, startAngle, endAngle, innerRadius, lineCap);
            this.$setAttribute(this.$border, {
                "d": border_d
            });
            // and set the border width
            $(this.$border).css("stroke-width", border);

            var pathRadius = radius - border - (width / 2);
            this.svgPathLength = this.$getArcLength(pathRadius, totalAngle);
            var d = this.$drawPath(radius, pathRadius, startAngle, endAngle);
            var attr = { "d": d, "stroke-width": width, "stroke-linecap": lineCap };

            // draw the path for slider path element
            this.$setAttribute(this.$path, attr);

            if (this._showRange) {
                // draw the path for slider range element
                this.$setAttribute(this.$range, attr);

                // there was a small bug when lineCap was round/square, this will solve that
                if (lineCap == "round" || lineCap == "square") this.$range.setAttribute("stroke-dashoffset", "0.01");
                else this.$range.removeAttribute("stroke-dashoffset");
            }
        },
        _setSVGStyles: function () {
            var o = this.options,
                borderColor = o.borderColor,
                pathColor = o.pathColor,
                rangeColor = o.rangeColor;

            if (borderColor) {
                $(this.$border).css("stroke", borderColor);
            }

            if (pathColor) {
                $(this.$path).css("stroke", pathColor);
            }

            if (this._showRange && rangeColor) {
                $(this.$range).css("stroke", rangeColor);
            }
        },
        _moveSliderRange: function (isInit) {
            if (!this._showRange) return;

            var startAngle = this._start,
                totalAngle = this._end;
            var handle1Angle = this._handle1.angle - startAngle,
                handle2Angle = this._handle2.angle - startAngle;
            if (isInit) handle1Angle = handle2Angle = 0;
            var dashArray = [];

            if (handle1Angle <= handle2Angle) {
                // starting the dashArray from 0 means normal range, otherwise it's invert range
                // so when handle1 value is smaller then it's a normal range selection only
                dashArray.push(0);
            }
            else {
                // when handle1 value is larger then it's a invert range selection, also swap the values
                var temp = handle1Angle;
                handle1Angle = handle2Angle;
                handle2Angle = temp;
            }

            var handle1Distance = (handle1Angle / totalAngle) * this.svgPathLength;
            dashArray.push(handle1Distance);

            var handle2Distance = ((handle2Angle - handle1Angle) / totalAngle) * this.svgPathLength;
            dashArray.push(handle2Distance, this.svgPathLength);

            this.$range.style.strokeDasharray = dashArray.join(" ");
        },
        _isPropsRelatedToSVG: function (property) {
            var svgRelatedProps = ["radius", "borderWidth", "width", "lineCap", "startAngle", "endAngle"];
            return this._hasProperty(property, svgRelatedProps);
        },
        _isPropsRelatedToSVGStyles: function (property) {
            var svgStylesRelatedProps = ["borderColor", "pathColor", "rangeColor"];
            return this._hasProperty(property, svgStylesRelatedProps);
        },
        _hasProperty: function (property, list) {
            if (typeof property == "string") {
                return (list.indexOf(property) !== -1);
            }
            else {
                var allProperties = Object.keys(property);
                return allProperties.some(function(prop) {
                    return (list.indexOf(prop) !== -1);
                });
            }
        },

        // WAI-ARIA support
        _updateARIA: function (value) {
            var o = this.options, min = o.min, max = o.max;
            this.bar.children().attr({ "aria-valuenow": value });
            if (o.sliderType == "range") {
                var handles = this._handles();
                handles.eq(0).attr({ "aria-valuemin": min });
                handles.eq(1).attr({ "aria-valuemax": max });

                if (this._active == 1) handles.eq(1).attr({ "aria-valuemin": value });
                else handles.eq(0).attr({ "aria-valuemax": value });
            }
            else this.bar.children().attr({ "aria-valuemin": min, "aria-valuemax": max });
        },
        // Listener for KO binding
        _checkKO: function () {
            var _data = this._dataElement().data("bind");
            if (typeof _data == "string" && typeof ko == "object") {
                var _vm = ko.dataFor(this._dataElement()[0]);
                if (typeof _vm == "undefined") return true;
                var _all = _data.split(","), _handler;
                for (var i = 0; i < _all.length; i++) {
                    var d = _all[i].split(":");
                    if ($.trim(d[0]) == "value") {
                        _handler = $.trim(d[1]);
                        break;
                    }
                }
                if (_handler) {
                    this._isKO = true;
                    ko.computed(function () { this.option("value", _vm[_handler]()); }, this);
                }
            }
        },
        // Listener for Angular binding
        _checkAngular: function () {
            if (typeof angular == "object" && typeof angular.element == "function") {
                this._ngName = this._dataElement().attr("ng-model");
                if (typeof this._ngName == "string") {
                    this._isAngular = true; var that = this;
                    this._scope().$watch(this._ngName, function (newValue, oldValue) { that.option("value", newValue); });
                }
            }
        },
        _scope: function () {
            return angular.element(this._dataElement()).scope();
        },
        _getDistance: function (p1, p2) {
            return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
        },
        _getXY: function (e) {
            if (e.type.indexOf("mouse") == -1) e = (e.originalEvent || e).changedTouches[0];
            return { x: e.pageX, y: e.pageY };
        },
        _getCenterPoint: function () {
            var block = this.block || this.svgContainer;
            var offset = block.offset(), center;
            center = {
                x: offset.left + (block.outerWidth() / 2),
                y: offset.top + (block.outerHeight() / 2)
            };
            return center;
        },
        _getAngleValue: function (point, center, isDrag) {
            var deg = Math.atan2(point.y - center.y, center.x - point.x);
            var angle = (-deg / (Math.PI / 180));
            if (angle < this._start) angle += 360;
            angle = this._checkAngle(angle, isDrag);
            return this._processStepByAngle(angle);
        },
        _checkAngle: function (angle, isDrag) {
            var o_angle = this._oriAngle(angle),
                preAngle = this["_handle" + this._active].angle,
                o_preAngle = this._oriAngle(preAngle);

            if (o_angle > this._end) {
                if (!isDrag) return preAngle;
                angle = this._start + (o_preAngle <= this._end - o_preAngle ? 0 : this._end);
            }
            else if (isDrag) {
                var d = this._handleDragDistance;
                if (this.isNumber(d)) if (Math.abs(o_angle - o_preAngle) > d) return preAngle;
            }
            return angle;
        },
        _processStepByAngle: function (angle) {
            var value = this._angleToValue(angle);
            return this._processStepByValue(value);
        },
        _processStepByValue: function (value) {
            var o = this.options, min = o.min, max = o.max, step = o.step, isMinHigher = (min > max);
            var remain, currVal, nextVal, preVal, newVal, ang;
            
            step = (isMinHigher ? -step : step);
            remain = (value - min) % step;

            currVal = value - remain;
            nextVal = this._limitValue(currVal + step);
            preVal = this._limitValue(currVal - step);

            if(!isMinHigher) {
                if (value >= currVal) newVal = (value - currVal < nextVal - value) ? currVal : nextVal;
                else newVal = (currVal - value > value - preVal) ? currVal : preVal;
            }
            else {
                if (value <= currVal) newVal = (currVal - value < value - nextVal) ? currVal : nextVal;
                else newVal = (value - currVal > preVal - value) ? currVal : preVal;
            }
            newVal = this._round(newVal), ang = this._valueToAngle(newVal);
            return { value: newVal, angle: ang };
        },
        _round: function (val) {
            var s = this.options.step.toString().split(".");
            return s[1] ? parseFloat(val.toFixed(s[1].length)) : Math.round(val);
        },
        _oriAngle: function (angle) {
            var ang = angle - this._start;
            if (ang < 0) ang += 360;
            return ang;
        },
        _limitAngle: function (angle) {
            if (angle > 360 + this._start) angle -= 360;
            if (angle < this._start) angle += 360;
            return angle;
        },
        _limitValue: function (value) {
            var o = this.options, min = o.min, max = o.max, isMinHigher = (min > max);
            if ((!isMinHigher && value < min) || (isMinHigher && value > min)) value = min;
            if ((!isMinHigher && value > max) || (isMinHigher && value < max)) value = max;
            return value;
        },
        _angleToValue: function (angle) {
            var o = this.options, min = o.min, max = o.max, value;
            value = (this._oriAngle(angle) / this._end) * (max - min) + min;
            return value;
        },
        _valueToAngle: function (value) {
            var o = this.options, min = o.min, max = o.max, angle;
            angle = (((value - min) / (max - min)) * this._end) + this._start;
            return angle;
        },
        _appendHiddenField: function () {
            this._hiddenField = this._hiddenField || this.$createElement("input");
            this._hiddenField.attr({
                "type": "hidden", "name": this._dataElement()[0].id || ""
            });
            this.control.append(this._hiddenField);
            this._updateHidden();
        },
        _updateHidden: function () {
            var val = this.options.value;
            this._hiddenField.val(val);
            if (this._isKO || this._isAngular) this._hiddenField.trigger("change");
            if (this._isAngular) this._scope()[this._ngName] = val;
        },
        _updateTooltip: function () {
            if (this.tooltip && !this.tooltip.hasClass("hover"))
                this.tooltip.html(this._getTooltipValue());
            this._updateTooltipPos();
        },
        _updateTooltipPos: function () {
            this.tooltip && this.tooltip.css(this._getTooltipPos());
        },
        _getTooltipPos: function () {
            var circleShape = this.options.circleShape, pos;
            var tooltipHeight = this.tooltip.outerHeight(), tooltipWidth = this.tooltip.outerWidth();

            if (circleShape == "full" || circleShape == "pie" || circleShape.indexOf("custom") === 0) {
                return {
                    "margin-top": -tooltipHeight / 2,
                    "margin-left": -tooltipWidth / 2
                };
            }
            else if (circleShape.indexOf("half") != -1) {
                switch (circleShape) {
                    case "half-top":
                    case "half-bottom":
                        pos = { "margin-left": -tooltipWidth / 2 }; break;
                    case "half-left":
                    case "half-right":
                        pos = { "margin-top": -tooltipHeight / 2 }; break;
                }
                return pos;
            }
            return {};
        },
        _formatValue: function(value){
            if(value> 1000){
                return (value/1000).toFixed(1)+'K'
            }
            if(value % 1 != 0)
                if(value >0 && value < 1)
                    return value.toFixed(2)
                else
                    return value.toFixed(1)
            return value
        },
        _getTooltipValue: function (isNormal) {
            var value = this.options.value;
            if (this._rangeSlider) {
                var p = value.split(",");
                if (isNormal) return p[0] + " - " + p[1];
                return this._tooltipValue(p[0], 1) + " - " + this._tooltipValue(p[1], 2);
            }
            if (isNormal) return value;
            return this._tooltipValue(this._formatValue(value));
        },
        _tooltipValue: function (value, index) {
            var returnValue = this._raise("tooltipFormat", { value: value, "handle": this._handleArgs(index) });
            return (returnValue != null && typeof returnValue !== "boolean") ? returnValue : value;
        },
        _validateStartAngle: function () {
            var start = this.options.startAngle;
            start = (this.isNumber(start) ? parseFloat(start) : 0) % 360;
            if (start < 0) start += 360;
            this.options.startAngle = start;
            return start;
        },
        _validateEndAngle: function () {
            var o = this.options, start = o.startAngle, end = o.endAngle;
            if (typeof end === "string" && this.isNumber(end) && (end.charAt(0) === "+" || end.charAt(0) === "-")) {
                try { end = eval(start + end.charAt(0) + Math.abs(parseFloat(end))); }
                catch (e) { console.warn(e); }
            }
            end = (this.isNumber(end) ? parseFloat(end) : 360) % 360;
            if (end <= start) end += 360;
            return end;
        },
        _refreshCircleShape: function () {
            var circleShape = this.options.circleShape;
            var allCircelShapes = ["half-top", "half-bottom", "half-left", "half-right",
                "quarter-top-left", "quarter-top-right", "quarter-bottom-right", "quarter-bottom-left",
                "pie", "custom-half", "custom-quarter"];
            var shape_codes = ["h1", "h2", "h3", "h4", "q1", "q2", "q3", "q4", "3/4", "ch", "cq"];

            if (allCircelShapes.indexOf(circleShape) == -1) {
                var index = shape_codes.indexOf(circleShape);
                if (index != -1) circleShape = allCircelShapes[index];
                else if (circleShape == "half") circleShape = "half-top";
                else if (circleShape == "quarter") circleShape = "quarter-top-left";
                else circleShape = "full";
            }
            this.options.circleShape = circleShape;
        },
        _appendOverlay: function () {
            var shape = this.options.circleShape;
            if (shape == "pie")
                this._checkOverlay(".rs-overlay", 270);
            else if (shape == "custom-half" || shape == "custom-quarter") {
                this._checkOverlay(".rs-overlay1", 180);
                if (shape == "custom-quarter")
                    this._checkOverlay(".rs-overlay2", this._end);
            }
        },
        _checkOverlay: function (cls, angle) {
            var overlay = this.container.children(cls);
            if (overlay.length == 0) {
                overlay = this.$createElement("div" + cls + " rs-transition rs-bg-color");
                this.container.append(overlay);
            }
            overlay.rsRotate(this._start + angle);
        },
        _checkDataType: function () {
            var m = this.options, i, prop, value, props = this._props();
            // to check number datatype
            for (i in props.numberType) {
                prop = props.numberType[i], value = m[prop];
                if (!this.isNumber(value)) m[prop] = this.defaults[prop];
                else m[prop] = parseFloat(value);
            }
            // to check input string
            for (i in props.booleanType) {
                prop = props.booleanType[i], value = m[prop];
                m[prop] = (value == "false") ? false : !!value;
            }
            // to check boolean datatype
            for (i in props.stringType) {
                prop = props.stringType[i], value = m[prop];
                m[prop] = ("" + value).toLowerCase();
            }
        },
        _validateSliderType: function () {
            var type = this.options.sliderType.toLowerCase();
            this._rangeSlider = this._showRange = false;
            if (type == "range") this._rangeSlider = this._showRange = true;
            else if (type.indexOf("min") != -1) {
                this._showRange = true;
                type = "min-range";
            }
            else type = "default";
            this.options.sliderType = type;
        },
        _updateStartEnd: function () {
            var o = this.options, circle = o.circleShape, startAngle = o.startAngle, endAngle = o.endAngle;

            if (circle != "full") {
                if (circle.indexOf("quarter") != -1) endAngle = "+90";
                else if (circle.indexOf("half") != -1) endAngle = "+180";
                else if (circle == "pie") endAngle = "+270";
                this.options.endAngle = endAngle;

                if (circle == "quarter-top-left" || circle == "half-top") startAngle = 0;
                else if (circle == "quarter-top-right" || circle == "half-right") startAngle = 90;
                else if (circle == "quarter-bottom-right" || circle == "half-bottom") startAngle = 180;
                else if (circle == "quarter-bottom-left" || circle == "half-left") startAngle = 270;
                this.options.startAngle = startAngle;
            }
        },
        _validateStartEnd: function () {
            this._start = this._validateStartAngle();
            this._end = this._validateEndAngle();

            var add = (this._start < this._end) ? 0 : 360;
            this._end += add - this._start;
        },
        _analyzeModelValue: function () {
            var o = this.options, val = o.value, min = o.min, max = o.max,
                lastValue, newValue, isNumber = this.isNumber,
                valueIsString = (typeof val == "string");

            if (val instanceof Array) val = val.toString();
            var parts = valueIsString ? val.split(",") : [val];

            if (this._rangeSlider) {
                if (valueIsString) {
                    if (parts.length >= 2) newValue = (isNumber(parts[0]) ? parts[0] : min) + "," +
                        (isNumber(parts[1]) ? parts[1] : max);
                    else newValue = isNumber(parts[0]) ? min + "," + parts[0] : min + "," + min;
                }
                else newValue = isNumber(val) ? min + "," + val : min + "," + min;
            }
            else {
                if (valueIsString) lastValue = parts.pop(), newValue = isNumber(lastValue) ? parseFloat(lastValue) : min;
                else newValue = isNumber(val) ? parseFloat(val) : min;
            }
            this.options.value = newValue;
        },
        _validateModelValue: function () {
            var val = this.options.value;
            if (this._rangeSlider) {
                var parts = val.split(","), val1 = parseFloat(parts[0]), val2 = parseFloat(parts[1]);
                val1 = this._limitValue(val1);
                val2 = this._limitValue(val2);
                if (!this._invertRange) if (val1 > val2) val2 = val1;

                this._handle1 = this._processStepByValue(val1);
                this._handle2 = this._processStepByValue(val2);
                this.options.value = this._handle1.value + "," + this._handle2.value;
            }
            else {
                var index = this._showRange ? 2 : (this._active || 1);
                this["_handle" + index] = this._processStepByValue(this._limitValue(val));
                if (this._showRange) this._handle1 = this._handleDefaults();
                this.options.value = this["_handle" + index].value;
            }
        },

        // common core methods
        $createElement: function (tag) {
            var t = tag.split('.');
            return $(document.createElement(t[0])).addClass(t[1] || "");
        },
        $createSVG: function (tag, attr) {
            var t = tag.split('.');
            var svgEle = document.createElementNS("http://www.w3.org/2000/svg", t[0]);
            if (t[1]) {
                svgEle.setAttribute("class", t[1]);
            }
            if (attr) {
                this.$setAttribute(svgEle, attr);
            }
            return svgEle;
        },
        $setAttribute: function (ele, attr) {
            for (var key in attr) {
                var val = attr[key];
                if (key === "class") {
                    var prev = ele.getAttribute('class');
                    if (prev) val += " " + prev;
                }
                ele.setAttribute(key, val);
            }
            return ele;
        },
        $append: function (parent, children) {
            children.forEach(function(element) {
                element && parent.appendChild(element);
            });
            return parent;
        },
        isNumber: function (number) {
            number = parseFloat(number);
            return typeof number === "number" && !isNaN(number);
        },
        getBrowserName: function () {
            var browserName = "", ua = window.navigator.userAgent;
            if ((!!window.opr && !!opr.addons) || !!window.opera || ua.indexOf(' OPR/') >= 0) browserName = "opera";
            else if (typeof InstallTrigger !== 'undefined') browserName = "firefox";
            else if (ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/') > 0) browserName = "ie";
            else if (!!window.StyleMedia) browserName = "edge";
            else if (ua.indexOf('Safari') != -1 && ua.indexOf('Chrome') == -1) browserName = "safari";
            else if ((!!window.chrome && !!window.chrome.webstore) || (ua.indexOf('Chrome') != -1)) browserName = "chrome";
            return browserName;
        },
        _isBrowserSupported: function () {
            var properties = ["borderRadius", "WebkitBorderRadius", "MozBorderRadius",
	            "OBorderRadius", "msBorderRadius", "KhtmlBorderRadius"];
            for (var i = 0; i < properties.length; i++) {
                if (document.body.style[properties[i]] !== undefined) return true;
            }
        },
        _throwError: function () {
            return "This browser doesn't support the border-radious property.";
        },
        _raise: function (event, args) {
            var o = this.options, fn = o[event], val = true;
            args = args || { value: o.value };
            args["id"] = this.id;
            args["control"] = this.control;
            args["options"] = o;
            if (fn) {
                args["type"] = event;
                if (typeof fn === "string") fn = window[fn];
                if ($.isFunction(fn)) {
                    val = fn.call(this, args);
                    val = val === false ? false : val;
                }
            }
            this.control.trigger($.Event(event, args));
            return val;
        },
        _bind: function (element, _event, handler) {
            $(element).bind(_event, $.proxy(handler, this));
        },
        _unbind: function (element, _event, handler) {
            $(element).unbind(_event, $.proxy(handler, this));
        },
        _getInstance: function () {
            return $.data(this._dataElement()[0], pluginName);
        },
        _saveInstanceOnElement: function () {
            $.data(this.control[0], pluginName, this);
        },
        _saveInstanceOnID: function () {
            var id = this.id;
            if (id && typeof window[id] !== "undefined") 
                window[id] = this;
        },
        _removeData: function () {
            var control = this._dataElement()[0];
            $.removeData && $.removeData(control, pluginName);
            if (control.id && typeof window[control.id]["_init"] === "function") 
                delete window[control.id];
        },
        _destroyControl: function () {
            if (this._isInputType) this._dataElement().insertAfter(this.control).attr("type", "text");
            this.control.empty().removeClass("rs-control").height("").width("");
            this._removeAnimation();
            this._bindControlEvents("_unbind");
        },

        // methods to dynamic options updation (through option)
        _updateWidth: function () {
            this.lastBlock.css("padding", this.options.width);
        },
        _readOnly: function (bool) {
            this._isReadOnly = bool;
            this.container.removeClass("rs-readonly");
            if (bool) this.container.addClass("rs-readonly");
        },

        // get & set for the properties
        _get: function (property) {
            return this.options[property];
        },
        _set: function (property, value) {
            var props = this._props();
            if ($.inArray(property, props.numberType) != -1) {          // to check number datatype
                if (!this.isNumber(value)) return;
                value = parseFloat(value);
            }
            else if ($.inArray(property, props.booleanType) != -1) {    // to check boolean datatype
                value = (value == "false") ? false : !!value;
            }
            else if ($.inArray(property, props.stringType) != -1) {     // to check input string
                value = value.toLowerCase();
            }

            if (this.options[property] == value) return;
            this.options[property] = value;
            switch (property) {
                case "startAngle":
                case "endAngle":
                    this._validateStartEnd();
                    this._updateSeperator();    // non SVG mode only
                    this._appendOverlay();      // non SVG mode only
                case "min":
                case "max":
                case "step":
                case "value":
                    this._analyzeModelValue();
                    this._validateModelValue();
                    this._setValue();
                    this._updatePre();
                    this._updateHidden();
                    this._updateTooltip();
                    break;
                case "radius":
                    this._setRadius();
                    this._updateTooltipPos();
                    break;
                case "width":
                    this._removeAnimation();
                    this._updateWidth();        // non SVG mode only
                    this._setRadius();
                    this._refreshHandle();
                    this._updateTooltipPos();
                    this._addAnimation();
                    this._refreshSeperator();   // non SVG mode only
                    break;
                case "borderWidth":
                    this._setRadius();
                    this._refreshHandle();
                    break;
                case "handleSize":
                    this._refreshHandle();
                    break;
                case "handleShape":
                    this._setHandleShape();
                    break;
                case "animation":
                    this._setAnimation();
                    break;
                case "showTooltip":
                    this.options.showTooltip ? this._appendTooltip() : this._removeTooltip();
                    break;
                case "editableTooltip":
                    this._tooltipEditable();
                    this._updateTooltipPos();
                    break;
                case "disabled":
                    this.options.disabled ? this.disable() : this.enable();
                    break;
                case "readOnly":
                    this.options.readOnly ? this._readOnly(true) : (!this.options.disabled && this._readOnly(false));
                    break;
                case "mouseScrollAction":
                    this._bindScrollEvents(this.options.mouseScrollAction ? "_bind" : "_unbind");
                    break;
                case "lineCap":
                    this._setRadius();
                    this._refreshSeperator();   // non SVG mode only
                    break;
                case "circleShape":
                    this._refreshCircleShape();
                    if (this.options.circleShape == "full") {
                        this.options.startAngle = 0;
                        this.options.endAngle = "+360";
                    }
                case "sliderType":
                    this._destroyControl();
                    this._onInit();
                    break;
                case "svgMode":
                    var $control = this.control, $options = this.options;
                    this.destroy();
                    $control[pluginName]($options);
                    break;
            }
            return this;
        },

        // public methods
        option: function (property, value) {
            if (!this._getInstance() || !this._isBrowserSupport) return;
            if ($.isPlainObject(property)) {
                if (property["min"] !== undefined || property["max"] !== undefined) {
                    if (property["min"] !== undefined) {
                        this.options.min = property["min"];
                        delete property["min"];
                    }
                    if (property["max"] !== undefined) {
                        this.options.max = property["max"];
                        delete property["max"];
                    }
                    if (property["value"] == undefined) {
                        this._set("value", this.options.value);
                    }
                }
                for (var prop in property) {
                    this._set(prop, property[prop]);
                }
            }
            else if (property && typeof property == "string") {
                if (value === undefined) return this._get(property);
                this._set(property, value);
            }

            // whenever the properties set dynamically, check for SVG mode. also check
            // any of the property was related to SVG. If yes, then redraw the SVG path
            if (this.options.svgMode && property) {
                if (this._isPropsRelatedToSVG(property)) {
                    this._setSVGAttributes();
                    this._moveSliderRange();
                }
                if (this._isPropsRelatedToSVGStyles(property)) {
                    this._setSVGStyles();
                }
            }

            return this;
        },
        getValue: function (index) {
            if (this.options.sliderType == "range" && this.isNumber(index)) {
                var i = parseFloat(index);
                if (i == 1 || i == 2)
                    return this["_handle" + i].value;
            }
            return this._get("value");
        },
        setValue: function (value, index) {
            if (this.isNumber(value)) {
                if (this.isNumber(index)) {
                    var sliderType = this.options.sliderType;
                    if (sliderType == "range") {
                        var i = parseFloat(index), val = parseFloat(value);
                        if (i == 1) value = val + "," + this._handle2.value;
                        else if (i == 2) value = this._handle1.value + "," + val;
                    }
                    else if (sliderType == "default") this._active = index;
                }
                this._set("value", value);
            }
        },
        disable: function () {
            this.options.disabled = true;
            this.container.addClass("rs-disabled");
            this._readOnly(true);
        },
        enable: function () {
            this.options.disabled = false;
            this.container.removeClass("rs-disabled");
            if (!this.options.readOnly) this._readOnly(false);
        },
        destroy: function () {
            if (!this._getInstance()) return;
            this._destroyControl();
            this._removeData();
            if (this._isInputType) this.control.remove();
        }
    };

    $.fn.rsRotate = function (degree) {
        var control = this, rotation = "rotate(" + degree + "deg)";
        control.css('-webkit-transform', rotation);
        control.css('-moz-transform', rotation);
        control.css('-ms-transform', rotation);
        control.css('-o-transform', rotation);
        control.css('transform', rotation);
        return control;
    }

    // The plugin constructor
    function RoundSlider(control, options) {
        this.id = control.id;
        this.control = $(control);

        // the options value holds the updated defaults value
        this.options = $.extend({}, this.defaults, options);
    }

    // The plugin wrapper, prevents multiple instantiations
    function CreateRoundSlider(options, args) {

        for (var i = 0; i < this.length; i++) {
            var that = this[i], instance = $.data(that, pluginName);
            if (!instance) {
                var _this = new RoundSlider(that, options);
                _this._saveInstanceOnElement();
                _this._saveInstanceOnID();
				
                if (_this._raise("beforeCreate") !== false) {
                    _this._init();
                    _this._raise("create");
                }
                else _this._removeData();
            }
            else if ($.isPlainObject(options)) {
                if (typeof instance.option === "function") instance.option(options);
                else if (that.id && window[that.id] && typeof window[that.id].option === "function") {
                    window[that.id].option(options);
                }
            }
            else if (typeof options === "string") {
                if (typeof instance[options] === "function") {
                    if ((options === "option" || options.indexOf("get") === 0) && args[2] === undefined) {
                        return instance[options](args[1]);
                    }
                    instance[options](args[1], args[2]);
                }
            }
        }
        return this;
    }

    // ### SVG related logic
    RoundSlider.prototype.$polarToCartesian = function (centerXY, radius, angleInDegrees) {
        var angleInRadians = (angleInDegrees - 180) * Math.PI / 180;
    
        return [
            centerXY + (radius * Math.cos(angleInRadians)),
            centerXY + (radius * Math.sin(angleInRadians))
        ].join(" ");
    }

    RoundSlider.prototype.$drawArc = function (centerXY, radius, startAngle, endAngle, isOuter) {
        var isCircle = (endAngle - startAngle == 360);
        var largeArcFlag = Math.abs(startAngle - endAngle) <= 180 ? "0" : "1";
        var isClockwise = true;
        var outerDirection = isClockwise ? 1 : 0;
        var innerDirection = isClockwise ? 0 : 1;
        var direction = isOuter ? outerDirection : innerDirection;
        var _endAngle = isOuter ? endAngle : startAngle;
    
        var path = [];
    
        // if it is a perfect circle then draw two half circles, otherwise draw arc
        if (isCircle) {
            var midAngle = (startAngle + endAngle) / 2;
            var midPoint = this.$polarToCartesian(centerXY, radius, midAngle);
            var endPoint = this.$polarToCartesian(centerXY, radius, _endAngle);
            path.push(
                "A", 1, 1, 0, 0, direction, midPoint,
                "A", 1, 1, 0, 0, direction, endPoint
            );
        }
        else {
            var endPoint = this.$polarToCartesian(centerXY, radius, _endAngle);
            path.push(
                "A", radius, radius, 0, largeArcFlag, direction, endPoint
            );
        }
    
        return path.join(" ");
    }

    RoundSlider.prototype.$drawPath = function (centerXY, outerRadius, startAngle, endAngle, innerRadius, lineCap){
        var outerStart = this.$polarToCartesian(centerXY, outerRadius, startAngle);
        var outerArc = this.$drawArc(centerXY, outerRadius, startAngle, endAngle, true);          // draw outer circle
    
        var d = [
            "M " + outerStart,
            outerArc
        ];
    
        if (innerRadius) {
            var innerEnd = this.$polarToCartesian(centerXY, innerRadius, endAngle);
            var innerArc = this.$drawArc(centerXY, innerRadius, startAngle, endAngle, false);     // draw inner circle
            
            if (lineCap == "none") {
                d.push(
                    "M " + innerEnd,
                    innerArc
                );
            }
            else if (lineCap == "round") {
                d.push(
                    "A 1, 1, 0, 0, 1, " + innerEnd,
                    innerArc,
                    "A 1, 1, 0, 0, 1, " + outerStart
                );
            }
            else if (lineCap == "butt" || lineCap == "square") {
                d.push(
                    "L " + innerEnd,
                    innerArc,
                    "L " + outerStart,
                    "Z"
                );
            }
        }
        return d.join(" ");
    }

    RoundSlider.prototype.$getArcLength = function (radius, degree = 360) {
        // when degree not provided we can consider that arc as a complete circle
        // circle's arc length formula => 2πR(Θ/360)
        return 2 * Math.PI * radius * (degree / 360);
    }

    $.fn[pluginName].prototype = RoundSlider.prototype;

})(jQuery, window);
