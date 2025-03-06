function flowGraph(el, config) {
    // configurations
    var width = +config.width,
        height = +config.height,
        margin = config.margin || { left: 20, top: 10, right: 50, bottom: 10 },

        edgeStrokeExtent = config.edgeStrokeExtent || [2, 8],
        edgeGlyphExtent = config.edgeGlyphExtent || [4, 16],
        edgeGlyph = typeof config.edgeGlyph !== "undefined" ? config.edgeGlyph : true,
        edgeThreshold = +config.edgeThreshold || 0,

        nodeFont = config.nodeFont || "Arial Narrow",
        nodeFontSize = config.nodeFontSize || "10pt",
        nodeStrokeExtent = config.nodeStrokeExtent || [1, 6],

        border = typeof config.border !== "undefined" ? config.border : false,

        mode = config.mode || "para"; // or "skel"

    // components
    var svg = d3.select(el).append("svg").attr("class", "--flow-graph")
        .attr("width", width).attr("height", height)
        .style("border", border ? "1px solid grey" : "none")
        .append("g").attr("transform", "translate(" + margin.left + ", " + margin.top + ")"),
        linkgroup = svg.append("g").attr("class", "linkgroup"),
        nodegroup = svg.append("g").attr("class", "nodegroup"),
        target = svg.append("g").attr("class", "target"),
        cat = svg.append("g").attr("class", "cat"),
        edgegroup = linkgroup.append("g").attr("class", "edges"),
        arrowgroup = linkgroup.append("g").attr("class", "arrows"),
        glyphgroup = linkgroup.append("g").attr("class", "glyphs"),
        targetFeats;

    svg.append("text")             
      .attr("x", 0  )
      .attr("y", 0-margin.top+20 ) 
      .style("text-anchor", "left")
      .style("opacity","1")
      .attr("font-size","14px")
      .text("Evolution Interface");

    svg.append("foreignObject")             
      .attr("x", 0 )
      .attr("y", 0-margin.top+30 ) 
      .attr("width","400px")
      .attr("height","100px")
      .style("text-anchor", "left")
      .style("opacity","0.5")
      .attr("dy", 0)//set the dy here
      .html("Use this interface to explore the outcome in the bar display."
        +" Start off by setting the <span style='color:green;font-size:130%'>input knobs</span> or click anywhere in the profile map."
        +" You can also compare the outcome with an alternative profile by clicking <span style='color:#F2711C;font-size:130%'>Initialize Comparison</span>.  ")
      // .call(wrap,width/2)

    var dispatch = d3.dispatch("node_dblclick", "edge_dblclick");

    var _model;

    function _trim() { // remove duplicate links in _model
        function linkCompare(a, b) { // compare links by source, then target
            if (a.source.id > b.source.id) {
                return 1;
            } else if (a.source.id < b.source.id) {
                return -1;
            } else {
                if (a.target.id > b.target.id) return 1;
                else if (a.target.id < b.target.id) return -1;
                else return 0;
            }
        }
        _model.links.sort(linkCompare); // sort links
        var i = 1;
        while (i < _model.links.length) { // remove duplicate links
            var curr = _model.links[i],
                prev = _model.links[i - 1];
            if (curr.source.id == prev.source.id && curr.target.id == prev.target.id) {
                var dup = !curr.beta || Math.abs(curr.beta) < Math.abs(prev.beta) ? i : i - 1;
                _model.links.splice(dup, 1);
            } else ++i;
        }
    }

    function _layout() { // layout nodes and links
        // Convert the graph model to a tree structure for d3 layout.
        _model.nodes.forEach(n => {
            n.parents = new Set();
            n.children = new Set();
        });
        _model.links.forEach(l => { // parents and children lists of each node
            l.target.parents.add(l.source);
            l.source.children.add(l.target);
        });

        ////test
        var ly = flowLayout(width - margin.left - margin.right, height - margin.top - margin.bottom);
        if (_model.links.length) {
            // console.log(_model)
            ly.flow(_model);
        } else {
            ly.circular(_model);
        }
        console.log(_model);
    }


    function _update(redraw = false, dur = 300) {
        /** Scalers */
        var edgeStrokeScale = d3.scaleLinear().domain([0, 0.6]).range(edgeStrokeExtent).clamp(true);
        var edgeGlyphScale = d3.scaleLinear().domain([0, 10]).range(edgeGlyphExtent).clamp(true);
        var nodeStrokeScale = d3.scaleLinear().domain([0, 1]).range(nodeStrokeExtent).clamp(true);
        /** Utility functions */
        var hidden = svg.append("text")
            .attr("class", "--hidden")
            .attr("font-family", nodeFont)
            .attr("font-size", nodeFontSize)
            .attr("font-weight", "bold")
            .attr("opacity", "0");

        function renderedTextSize(string) { // size of node box
            hidden = hidden.text(string);
            var bBox = hidden.node().getBBox();
            return {
                width: bBox.width,
                height: bBox.height
            };
        }

        function link_class(d) { // class of link path
            if (d.direct_type === "Nondirected") return "link undir";
            else if (typeof(d.beta) === "undefined" || mode == "skel") return "link dir";
            else if (d.source.data_type == "Categorical" || d.target.data_type == "Categorical") return "link com";
            else return d.beta >= 0 ? "link pos" : "link neg";
        }

        function link_stroke_width(d) { // link stroke width
            var sw;
            if (typeof(d.beta) == "undefined")
                sw = edgeStrokeExtent[0] + 1;
            else
                sw = edgeStrokeScale(Math.abs(d.beta));
            return Math.round(sw) + "px";
        }
        function compute_path(source,target){
            var s,t;
            s = { "x": source.x + source.xOffset, "y": source.y + source.yOffset };
            t = { "x": target.x + target.xOffset, "y": target.y + target.yOffset };

            return "M" + s.x + "," + s.y +
                    "C" + (s.x + t.x) / 2 + "," + s.y +
                    " " + (s.x + t.x) / 2 + "," + t.y +
                    " " + t.x + "," + t.y;
        }
        function general_path(d){
            var x1Offset,x2Offset,y1Offset,y2Offset;
            // if(d.source.data_type != 'Categorical' && d.target.data_type != 'categorical'){
            if ((d.target.x ) - (d.source.x ) > 20) {
                x1Offset = 72, y1Offset=20, x2Offset=0, y2Offset=20;
                
            } else if ((d.target.x ) - (d.source.x ) < -20) { // target on the left of source
                x1Offset = 0, y1Offset=20, x2Offset=72, y2Offset=30;
            } 

            else {
                // console.log("else")
                x1Offset = d.source._size.width/2, y1Offset=d.source._size.height * (d.source.y < d.target.y ? .5 : -.5),
                x2Offset=d.target._size.width/2, y2Offset=d.target._size.height * (d.source.y > d.target.y ? .5 : -.5);
            }
            // }
            return compute_path({ "x": d.source.x, 'xOffset': x1Offset, "y": d.source.y,'yOffset':y1Offset },
                                 { "x": d.target.x ,'xOffset':x2Offset, "y": d.target.y, 'yOffset':y2Offset })
        }
        function target_path(d){
            var x1Offset,x2Offset,y1Offset,y2Offset;
            if (d.source.name == target_name){
                if ((d.target.x ) - (d.source.x ) > 20) {
                    x1Offset = d.source._size.width / 2 + 5, y1Offset=20, x2Offset=0, y2Offset=20;
                } else if ((d.target.x ) - (d.source.x ) < -20) { // target on the left of source
                    x1Offset = -d.source._size.width / 2 - 5, y1Offset=0, x2Offset=0, y2Offset=20;
                } else {
                    x1Offset = 0, y1Offset=d.source._size.height * (d.source.y < d.target.y ? .5 : -.5),
                    x2Offset=0, y2Offset=d.target._size.height * (d.source.y > d.target.y ? .5 : -.5);
                }
            }
            else if(d.target.name == target_name){
                // console.log("target target")
                if ((d.target.x ) - (d.source.x ) > 20) {
                    // console.log("bl1")
                    x1Offset =  72, y1Offset=20, x2Offset= -d.target._size.width / 2 + 5, y2Offset=20;
                } else if ((d.target.x ) - (d.source.x ) < -20) { // target on the left of source
                    // console.log("bl2")
                    x1Offset =  0, y1Offset=0, x2Offset= +d.source._size.width / 2 , y2Offset=20;
                } else {
                    // console.log("bl3")
                    x1Offset = 0, y1Offset=d.source._size.height * (d.source.y < d.target.y ? .5 : -.5),
                    x2Offset=0, y2Offset=d.target._size.height * (d.source.y > d.target.y ? .5 : -.5);
                }
            }
            return compute_path({ "x": d.source.x, 'xOffset': x1Offset, "y": d.source.y,'yOffset':y1Offset },
                         { "x": d.target.x ,'xOffset':x2Offset, "y": d.target.y, 'yOffset':y2Offset })
        }

        function link_path(d) { // d of link path
            // console.log(d)
            var s, t;
            if(d.source.name != target_name && d.target.name != target_name )
                return general_path(d)       
            else 
                return target_path(d)    
        }

        function arrow_class(d) {
            if (d.direct_type === "Nondirected") return "arrow none";
            else if (typeof(d.beta) === "undefined" || mode == "skel") return "arrow dir";
            else if (d.source.data_type == "Categorical" || d.target.data_type == "Categorical") return "arrow com";
            else return d.beta >= 0 ? "arrow pos" : "arrow neg";
        }

        function arrow_path(d) {
            var _path = edgegroup.select("#l" + d.source.id + "-" + d.target.id).node();
            var len = _path.getTotalLength(),
                pos0 = _path.getPointAtLength(len * 0.45),
                pos1 = _path.getPointAtLength(len * 0.45 + 10),
                angle = Math.atan2(pos1.y - pos0.y, pos1.x - pos0.x),
                dist = 4;
            var p1 = (Math.sin(angle) * dist + pos0.x) + "," + (-Math.cos(angle) * dist + pos0.y),
                p2 = (-Math.sin(angle) * dist + pos0.x) + "," + (Math.cos(angle) * dist + pos0.y);
            return "M" + p1 + "L" + p2 + "L" + pos1.x + "," + pos1.y + "Z";
        }

        function glyph_class(d) {
            if (!edgeGlyph || !d.delta_score || mode == "skel") return "glyph non";
            else return d.delta_score >= 0 ? "glyph pos" : "glyph neg";
        }

        function glyph_path(d) {
            if (d.delta_score && mode != "skel") {
                var s = edgeGlyphScale(Math.abs(d.delta_score)),
                    h = 0.5 * s;
                return d.delta_score < 0 ? ["M", 0, ",", 0, "L", s, ",", 0].join("") : ["M", 0, ",", 0, "L",
                    s, ",", 0, "M", h, ",", -h, "L", h, ",", h
                ].join("");
            } else return "";
        }

        function glyph_transform(d) {
            var _path = edgegroup.select("#l" + d.source.id + "-" + d.target.id).node();
            var len = _path.getTotalLength(),
                pos0 = _path.getPointAtLength(len * 0.6),
                pos1 = _path.getPointAtLength(len * 0.6 + 10),
                angle = Math.atan2(pos1.y - pos0.y, pos1.x - pos0.x),
                dist = edgeGlyphExtent[1];
            var p1 = (Math.sin(angle) * dist + pos0.x) + "," + (-Math.cos(angle) * dist + pos0.y),
                p2 = (-Math.sin(angle) * dist + pos0.x) + "," + (Math.cos(angle) * dist + pos0.y);
            if (-Math.PI / 2 < angle && angle < Math.PI / 2)
                return "translate(" + p1 + ")";
            else return "translate(" + p2 + ")";
        }

        function link_arrow_visibility(d) {
            return typeof(d.beta) === "undefined" || Math.abs(d.beta) > edgeThreshold ? "visible" : "hidden";
        }

        function node_class(d) {
            return "label-bg " + (d.data_type == "Unset" ? "unset" : (d.data_type == "Numeric" ? "num" : "cat"));
        }

        function node_stroke_width(d) {
            var sc;
            if (typeof d.rsquared !== "undefined")
                sc = nodeStrokeScale(d.rsquared);
            else if (typeof d.rsquared_pseudo !== "undefined")
                sc = nodeStrokeScale(d.rsquared_pseudo);
            else
                sc = nodeStrokeExtent[0];
            return Math.round(sc) + "px";
        }

        /** Calculate width of each node */
        _model.nodes.forEach(d => d._size = renderedTextSize(d.name));
        _model.links.forEach(function(d){
            d.source._size = renderedTextSize(d.source.name);
            d.target._size = renderedTextSize(d.target.name);
        })
        // console.log(_model)

        /** Render shapes */
        // links
        var links = edgegroup.selectAll(".link")
            .data(_model.links, l => "l" + l.source.id + "-" + l.target.id);

        var _update = links.attr("class", d => link_class(d))
            .attr("id", function(d) { return "l" + d.source.id + "-" + d.target.id; })
            .transition().duration(dur)
            .attr("stroke-width", d => link_stroke_width(d))
            .attr("d", d => link_path(d))
            .attr("visibility", d => link_arrow_visibility(d));

        var _enter = links.enter().append("path")
            .attr("class", d => link_class(d))
            .attr("id", function(d) { return "l" + d.source.id + "-" + d.target.id; })
            .attr("stroke-width", d => link_stroke_width(d))
            .attr("d", d => link_path(d))
            .attr("visibility", d => link_arrow_visibility(d))
            .on("dblclick", function(d) { dispatch.call("edge_dblclick", this, d); })
            .attr("opacity", 0).transition().duration(dur).attr("opacity", 0.8);

        links.exit()
            .transition().duration(dur).attr("opacity", 0).remove();

        if (redraw) {
            arrowgroup.selectAll("*").remove();
            glyphgroup.selectAll("*").remove();
            _enter.on("end", render_arrow_glyph);
            _update.on("end", render_arrow_glyph);
        } else {
            render_arrow_glyph();
        }

        function render_arrow_glyph(dur = 0) {
            // arrows
            var arrows = arrowgroup.selectAll(".arrow")
                .data(_model.links, l => "a" + l.source.id + "-" + l.target.id);

            arrows.attr("class", d => arrow_class(d))
                .attr("id", function(d) { return "a" + d.source.id + "-" + d.target.id; })
                .attr("d", d => arrow_path(d))
                .attr("stroke-width", d => link_stroke_width(d))
                .attr("visibility", d => link_arrow_visibility(d));

            arrows.enter().append("path")
                .attr("class", d => arrow_class(d))
                .attr("id", function(d) { return "a" + d.source.id + "-" + d.target.id; })
                .attr("d", d => arrow_path(d))
                .attr("stroke-width", d => link_stroke_width(d))
                .attr("visibility", d => link_arrow_visibility(d))
                .on("dblclick", function(d) { dispatch.call("edge_dblclick", this, d); })
                .attr("opacity", 0).transition().duration(dur).attr("opacity", 1);

            arrows.exit()
                .transition().duration(dur).attr("opacity", 0).remove();
        }

        function formatValue(value){
            if(value> 1000){
                return (value/1000).toFixed(1)+'K'
            }
            if(value % 1 != 0)
                if(value >0 && value < 1)
                    return value.toFixed(2)
                else
                    return value.toFixed(1)
            return value
        }

        //knobs
        var knobs = nodegroup.selectAll('foreignObject')
            .data(_model.nodes.filter(function(d){return d.name !=target_name && d.data_type == 'Numeric'}));

        var foreignObject = knobs.enter().append("foreignObject")
            .attr("class", "label-bg")
            .attr('id',d => d.id+'_node')
            .attr("name", d => d.name)
            .attr("x", d => d.x -5 )
            .attr("y", d => d.y - 10)
            .attr("width", '100')
            .attr("height", '100')
            .style('display','inline-block');

        foreignObject.append('xhtml:div')
        .attr("class", "main_knobs")
        .attr('id',d => d.id+'_mainknob')
        .attr("name", d => d.name)
        .style("position",'absolute')
        .style("left",'0px')
        .style("top",'0px')

        $('.main_knobs').each(function(i, obj) {
            // console.log(d3.select(this).data());
            d = d3.select(this).data()[0]
            $(this).roundSlider({
                sliderType: "min-range",
                width:8,
                radius:40,
                min:d.min,
                max:d.max,
                showTooltip:true,
                step: stepSizes[d.name],
                value: d.min,
                svgMode: true,
                change: function(args){
                    if(!isPlayed){
                        console.log("main knob changed!")
                        id = args.id.split("_")[0]
                        node = active_model.nodes.filter(function(d){ return d.id == id})[0]
                        val = args.value
                        node_values[node.name] =+ (val-node.mean)/node.std
                        knob_values[node.name] =+ val
                        node.intervened = node.parents.size ? 1:0;
                        update_main_node_values()
                        update_target(knob_values[target_name])
                        
                        update_scatter_plot()
                        feasibility_score()   
                    }
                    
                },
                drag: function(args){
                    id = parseInt(args.id.split("_")[0])
                    $("#"+id+"_maininput").val(args.value)
                }              
            });
        });

        foreignObject.append('xhtml:div')
        .attr("class", "change_knobs")
        .attr('id',d => d.id+'_changeKnob')
        .attr("name", d => d.name+"_change")
        .attr("min", d => d.min)
        .attr("max", d => d.max)
        .style("position",'absolute')
        .style("left",'10px')
        .style("top",'10px')

        $('.change_knobs').each(function(i, obj) {
            // console.log(d3.select(this).data()[0]);
            d = d3.select(this).data()[0]
            // console.log(d.min)
            $(this).roundSlider({
                sliderType: "min-range",
                width:6,
                radius:30,
                min:d.min,
                max:d.max,
                handleSize:1,
                readOnly:true,
                showTooltip:false,
                step: stepSizes[d.name],
                value: d.min,
                svgMode: true,
                change: function(args){
                    if(!isPlayed){
                        console.log("change knob changed!!")
                        id = args.id.split("_")[0]
                        node = active_model.nodes.filter(function(d){ return d.id == id})[0]
                        val = args.value
                        compare_node_values[node.name] =+ (val-node.mean)/node.std
                        compare_knob_values[node.name] =+ val
                        node.intervened = node.parents.size ? 1:0;
                        update_alternate_node_values()
                        update_target(compare_knob_values[target_name],true)
                        // $("#"+id+"_changeinput").val(formatValue(val))
                        // update_latent_variables()
                        // compare_val = regression(compare_node_values,change_probe=true) 

                        update_scatter_plot()
                        feasibility_score()
                    }
                },
                drag: function(args){
                    id = args.id.split("_")[0]
                    $("#"+id+"_changeinput").val(formatValue(args.value))
                } 
            });
        });
            // .call(d3.drag().on("drag", d => on_drag(d))); 

            
         // nodes
        var rects = nodegroup.selectAll(".rect")
            .data(_model.nodes, d => d.name);

        // labels inside nodes
        var labels = nodegroup.selectAll("text")
            .data(_model.nodes, d => d.name);

        labels.enter().append("text")
            .attr("class", "label_text")
            .attr("x", d => d.x)
            .attr("y", d => d.y-12)
            .attr("id", d => d.id+"_text")
            .attr("font-family", nodeFont)
            .attr("font-size", nodeFontSize)
            .attr("font-weight", "bold")
            // .style("cursor","pointer")
            // .attr("opacity", 0).transition().duration(dur).attr("opacity", 0.8)
            .text(d => d.name);
            // .call(d3.drag().on("drag", d => on_drag(d))); 

        rects.enter().append("rect")
            .attr("class", "rect")
            .attr("x", d => d.x )
            .attr("y", d => d.y-24)
            .attr("width", d => d._size.width + 10)
            .attr("height", d => d._size.height)
            .call(d3.drag().on("drag", d => on_drag(d)));



        //latent variables
        var latents = nodegroup.selectAll('.latent')
            .data(_model.nodes.filter(function(d){return d.name !=target_name && (d.data_type == 'Latent')}));

        // console.log(latents)
        latents.enter().append("rect")
            .attr("class", "latent")
            .attr("x", function(d){ return d.x })
            .attr("y", d => d.y - d._size.height / 2)
            .attr("width", 70)
            .attr("height", 50);

        //endegenous remove icon
        var remove = nodegroup.selectAll('.remove')
            .data(_model.nodes.filter(function(d){return d.name !=target_name && (d.parents.size)}));

        // console.log(latents)
        remove.enter().append("foreignObject")
            .attr("width",20)
            .attr("height",20)
            .attr("class","icon_div")
            .attr("x", d => d.x+d._size.width)
            .attr("y", d => d.y-40)
            .append("xhtml:i")
            .attr("class", "times circle icon remove_icon")
            .attr("id", d => d.id+"_icon")
            .style("display","none")
            .style("cursor","pointer")
        

        knobs.enter().append("foreignObject")
                .attr("x", d => d.x + d._size.width+ 10 )
                .attr("y", d => d.y - 30)
                .attr("width", '40px')
                .attr("height", '20px')
                .attr("class","changeknobs_input")        
                .append("xhtml:input")
                .attr("type","text")
                .attr("id",d => d.id+"_changeinput")
                .attr("class","changeinput");       

        svg.append("foreignObject")
                .attr("x", 2*width/3)
                .attr("y", 0-margin.top)
                .attr("width", '150px')
                .attr("height", '50px')
                .attr("class","svg_buttons")
                .style('display','inline-block')           
                .append("xhtml:button")
                .attr("id","play")
                .attr("class","mini ui button orange play_stop")
                .text("Initialize Comparison");

        var cancel_button = svg.append("foreignObject")
                .attr("x", 2*width/3+140)
                .attr("y", 0-margin.top)
                .attr("width", '150px')
                .attr("height", '50px')
                .attr("class","svg_buttons") 
                .html("<button id='stop' class='ui mini button play_stop' style='display:none'></i>Cancel Comparsion</button>")         
        
        var p1 = svg.append("foreignObject")
                .attr("x", 2*width/3)
                .attr("y", 0-margin.top+40)
                .attr("width", '180px')
                .attr("height", '50px')
                .attr("class","svg_buttons")
                .style('display','inline-block') 

            p1.append("xhtml:button")
                .attr("id","commit")
                .attr("class","mini ui button green play_stop")
                .text("Commit Comparison")
                .style("display","none");
            // p1.append("xhtml:label")
            //     .attr("top","50")
            //     .text("Use this to change persona1 to be persona2")

        hidden.remove();
        // set the dimensions and margins of the graph
        var bar_margin = {top: 5, right: 40, bottom: 20, left: 75},
            bar_width = 240 - bar_margin.left - bar_margin.right,
            bar_height = 80 - bar_margin.top - bar_margin.bottom;

        targetFeats = _model.nodes.filter(function(d){return d.name ==target_name})
        console.log("targetssss")
        console.log(targetFeats)

        d3.select(".target > svg").remove()
        d3.select(".target").append("svg")
          .attr("id","target_svg")
          .attr("width", bar_width + bar_margin.left + bar_margin.right)
          .attr("height", bar_height + bar_margin.top + bar_margin.bottom)
          .attr("x",targetFeats[0].x)
          .attr("y",targetFeats[0].y)
        .append("g")
          .attr("id","target_bars")
          .attr("transform", 
                "translate(" + bar_margin.left+ "," + bar_margin.top + ")");


        function on_drag(d) {
            // console.log(d)
            d.x = Math.min(width - margin.left - margin.right, Math.max(0, d3.event.x));
            d.y = Math.min(height - margin.top - margin.bottom, Math.max(0, d3.event.y));
            edgegroup.selectAll(".link").attr("d", l => link_path(l));
            arrowgroup.selectAll(".arrow").attr("d", l => arrow_path(l));
            glyphgroup.selectAll(".glyph").attr("transform", l => glyph_transform(l));
            nodegroup.selectAll(".label-bg")
                .attr("x", d => d.x  - 5)
                .attr("y", d => d.y - 10);
            cat.selectAll(".label-bg")
                .attr("x", d => d.x - d._size.width/2 )
                .attr("y", d => d.y + 10);
            nodegroup.selectAll(".label_text")
                .attr("x", d => d.x)
                .attr("y", d => d.y-12);
            nodegroup.selectAll(".rect")
                .attr("x", d => d.x)
                .attr("y", d => d.y-24);
            nodegroup.selectAll(".changeknobs_input")
                .attr("x", d => d.x + d._size.width + 10)
                .attr("y", d => d.y-30);

            nodegroup.selectAll(".latent")
                .attr("x", d => d.x)
                .attr("y", d => d.y-d._size.height/2);
            nodegroup.selectAll(".latent_text")
                .attr("x", d => d.x+20)
                .attr("y", d => d.y+20);
            nodegroup.selectAll(".latent_text1")
                .attr("x", d => d.x+d._size.width+10)
                .attr("y", d => d.y-15);
            nodegroup.selectAll(".icon_div")
                .attr("x", d => d.x+d._size.width)
                .attr("y", d => d.y-40);
            
            // nodegroup.selectAll(".minimizeicons")
            //     .attr("x", d => d.x + d._size.width +25)
            //     .attr("y", d => d.y-33);
            // nodegroup.selectAll(".popuptooltips")
            //     .attr("x", d => d.x + d._size.width +20)
            //     .attr("y", d => d.y-50);
            if(d.name == target_name){
                // console.log(d3.select("#target_svg"))
                d3.select("#target_svg")
                    .attr("x",d.x)
                    .attr("y",d.y-10)
            }
                    
        }
    }

    function my() {}

    my.load = function(model, _mode) {
        // _clear();
        _model = model;
        _model.links.forEach(l => {
            l.source = _model.nodes.find(n => n.id == l.source.id);
            l.target = _model.nodes.find(n => n.id == l.target.id);
        });
        // _trim();
        _layout();
        if (_mode)
            mode = _mode;
        _update(true);
        return _model;
    };

    my.update = function(model, _mode) {
        _model.nodes.forEach(n => {
            var d = model.nodes.find(v => v.id == n.id);
            n.data_type = d.data_type;
            if (typeof(n.rsquared) !== "undefined") n.rsquared = d.rsquared;
            if (typeof(n.rsquared_pseudo) !== "undefined") n.rsquared_pseudo = d.rsquared_pseudo;
        });
        _model.links = model.links;
        _model.links.forEach(l => {
            l.source = _model.nodes.find(n => n.id == l.source);
            l.target = _model.nodes.find(n => n.id == l.target);
        });
        _trim();
        if (_mode)
            mode = _mode;
        mode = _mode;
        _update(false);
        return my;
    };

    my.clear = function() {
        nodegroup.selectAll("*").remove();
        edgegroup.selectAll("*").remove();
        arrowgroup.selectAll("*").remove();
        glyphgroup.selectAll("*").remove();
    };

    my.mode = function(_mode) {
        if (!arguments.length) return mode;
        else mode = _mode;
        _update(false);
        return my;
    };

    my.edgeThreshold = function(threshold) {
        if (!arguments.length) return edgeThreshold;
        edgeThreshold = Math.max(0, threshold);
        _update();
        return my;
    };

    my.toggleEdgeGlyph = function(show) {
        if (!arguments.length)
            edgeGlyph = !edgeGlyph;
        else
            edgeGlyph = show ? true : false;
        if (_model) _update();
        return my;
    };

    my.toggleBorder = function(show) {
        if (!arguments.length)
            border = !border;
        else
            border = show ? true : false;
        d3.select(el).select(".--flow-graph")
            .style("border", border ? "1px solid grey" : "none");
        return my;
    };

    my.on = function on(typename, callback) {
        dispatch.on(typename, callback);
        return my;
    };

    return my;
};

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        x = text.attr("x"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}