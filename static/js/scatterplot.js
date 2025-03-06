function scatterplot(data,axis=false,dot_size=3.5){
	// $("#sc_svg").remove()
	// $("#scatter_plot").css('display','inline-block')
	// $("#slider_div").show()
	$("#scatter_plot").empty()
	$('#legend1').empty()
	
	// for(i=0;i<data.length;i++){
	// 	row = data[i]
	// 	row['regr_val'] = regression(row.attributes,change_probe=false,only_values=true)
	// }
	data.forEach(function(d,ind){
		// console.log(d.attributes)
		d['std_attributes'] =  stardardize(d.attributes)
		res = update_node_values(d.std_attributes,d.attributes)
    d['regr_val'] = res[1][target_name]
	})
	// console.log(data)
	// var tooltip = d3.select("#tooltip")

	// set the dimensions and margins of the graph
	var margin = {top: 30, right: 30, bottom: 80, left: 10},
	    width = $("#persona_div").width()-50 - margin.left - margin.right,
	    height = $("#persona_div").height()/3 - margin.top - margin.bottom;
	// console.log(data[0][x],data[0][y])
	// set the ranges
	var xScale = d3.scaleLinear().range([0, width]);
	var yScale = d3.scaleLinear().range([height, 0]);

	// xMin = 
	valMax = d3.max(data, function(d) { return d.regr_val; })
	valMin = d3.min(data, function(d) { return d.regr_val; })
	var colorScale1 = d3.scaleSequential().domain([valMin, valMax]).interpolator(d3.interpolateRdBu);
	
	// append the svg obgect to the body of the page
	// appends a 'group' element to 'svg'
	// moves the 'group' element to the top left margin
	var svg = d3.select("#scatter_plot").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform",
	          "translate(" + margin.left + "," + margin.top + ")");

	// Scale the range of the data
	xMax = d3.max(data, function(d) { return d.PC1; })
	xMin = d3.min(data, function(d) { return d.PC1; })
	yMax = d3.max(data, function(d) { return d.PC2; })
	yMin = d3.min(data, function(d) { return d.PC2; })
	
	xScale.domain([-1,1]);
	yScale.domain([-1,1]);
	 
	// Add the scatterplot
	  svg.selectAll(".dot")
	      .data(data)
	    .enter().append("circle")
	      .attr('class','dot')
	      .attr("r", function(d) {
	      	if(d.index >= 0 ) 
	      		return dot_size
	      	else
	      		return 8;
	      })
	      .attr("cx", function(d) { return xScale(d.PC1); })
	      .attr("cy", function(d) { return yScale(d.PC2); })
	      // .style("fill","steelblue");
	      .style("fill", function(d) {		
	      	if(d.index == -1)
	      		return "rgb(102, 204, 102)"
	      	else if (d.index == -2)
	      		return '#F2711C'
	      	else return colorScale1(d.regr_val);
	      })
	      .on("mouseover", function(d) {
	      	if(!isClicked){
		      	compare_index =+ d.index
		      	// update_neighbour_info()
		      	isProbed = true
                play_probe(d.attributes,false)
                feasibility_score()
	        }

         })
         .on("mouseout", function() {
         	if(!isClicked){
         		compare_index = -1
	      		// update_neighbour_info()
	      		stop_probe(false)
	      		feasibility_score()
                // d3.select("#tooltip1").classed("hidden", true); 
         	}
         })
         .on("click", function(d){
            if(!isClicked){
             	isClicked = true
             	saved_color = d3.select(this).style('fill')
             	d3.select(this).classed("compared",true).attr('r','8').style('fill', '#F2711C')
            }
         	// insert_state()
         })

    //arrow
	svg.append("svg:defs").append("svg:marker")
	    .attr("id", "triangle")
	    .attr("refX", 6)
	    .attr("refY", 6)
	    .attr("markerWidth", 30)
	    .attr("markerHeight", 30)
	    .attr("markerUnits","userSpaceOnUse")
	    .attr("orient", "auto")
	    .append("path")
	    .attr("d", "M 0 0 12 6 0 12 3 6")
	    .style("fill", "black");

    // add lines
    svg.selectAll("line")
	      .data(axis)
	    .enter().append("line")
	      .attr('class','axis')
	      .attr("x1", xScale(0))
  		  .attr("y1", yScale(0))
    	  .attr("x2", function(d){return xScale(d.PC1)})
  		  .attr("y2", function(d){return yScale(d.PC2)}) 
  		  .attr("stroke-width", 1)
  		  .attr("stroke", "black")
  		  .style("display",function(){if(!show_axis) return "none"})
  		  .style("opacity","0.2")
  		  .attr("marker-end", "url(#triangle)");

    svg.selectAll(".variable")
	      .data(axis)
	    .enter().append("text")
	    .attr("class", "axis_labels")
	    .attr("transform", function(d){ return "translate("+xScale(d.PC1)+","+yScale(d.PC2)+") "})
	    .text(function(d){ return d.variable})
	    .style("display",function(){if(!show_axis) return "none"})
	    .style("opacity","0.2")
	    .style('pointer-events', 'none');

	// Add the X Axis
	//   svg.append("g")
	//       .attr("transform", "translate(0," + height + ")")
	//       .attr('class','axisGrey')
	//       .call(d3.axisBottom(xScale).ticks(5));

	// // Add the Y Axis
	//   svg.append("g")
	//   	  .attr("transform", "translate(0,0)")
	//   	  .attr('class','axisGrey')
	//       .call(d3.axisLeft(yScale).ticks(5));

	// // text label for the x axis
    svg.append("text")             
      .attr("transform",
            "translate(" + (width/2+10) + " ," + 
                           (-20) + ")")
      .style("text-anchor", "middle")
      .style("opacity","1")
      .text("Profile Map");

    svg.append("foreignObject")             
      .attr("x", (0-margin.left) )
      .attr("y", height ) 
      .attr("width",$("#persona_div").width()-50)
      .attr("height","80px")
      .style("text-anchor", "left")
      .style("opacity","0.5")
      .attr("dy", 0)//set the dy here
      .html("This map shows how the current <span style='color:green;font-size:130%'>profile</span> compares with previous profiles." 
       +" The colors indicate their outcomes (low to high)." 
       +" You can  click anywhere and choose that point <span style='color:#F2711C;font-size:130%'>for comparison</span>.")
      // .call(wrap,width)

     // svg.append("foreignObject")

    var checkbox = svg.append("foreignObject")
        .attr("x", width-80)
        .attr("y", 0-margin.top-2)
        .attr("width", '100px')
        .attr("height", '30px')
        .style('display','inline-block')           
        
    if(show_axis)
    	checkbox    
    	.append("xhtml:input")
        .attr("type","checkbox")
        .attr("id","show_axis")
        .attr("value","1")
        .attr("checked","")
    else
    	checkbox    
    	.append("xhtml:input")
        .attr("type","checkbox")
        .attr("id","show_axis")
        .attr("value","1")

     checkbox    
    	.append("xhtml:label")
    	.style("position","relative")
    	.style("left","5px")
        .text("Show axis");


    continuous("#legend1", colorScale1, 160, 75);

	  // $("#scatter_div").append("<div id='details_div'></div>")
	
}

// create continuous color legend
function continuous(selector_id, colorscale, legendheight, legendwidth) {
  var margin = {top: 20, right: 60, bottom: 10, left: 2};

  var canvas = d3.select(selector_id)
    .style("position", "absolute")
    .append("canvas")
    .attr("height", legendheight - margin.top - margin.bottom)
    .attr("width", 1)
    .style("height", (legendheight - margin.top - margin.bottom) + "px")
    .style("width", (legendwidth - margin.left - margin.right) + "px")
    .style("border", "1px solid #000")
    .style("position", "absolute")
    .style("top",  "40px")
    .style("left",  "-5px")
    .node();

  var ctx = canvas.getContext("2d");

  var legendscale = d3.scaleLinear()
    .range([ legendheight - margin.top - margin.bottom,1])
    .domain(colorscale.domain());

  // image data hackery based on http://bl.ocks.org/mbostock/048d21cf747371b11884f75ad896e5a5
  var image = ctx.createImageData(1, legendheight);
  d3.range(legendheight).forEach(function(i) {
  	// console.log(i)
    var c = d3.rgb(colorscale(legendscale.invert(i)));
    image.data[4*i] = c.r;
    image.data[4*i + 1] = c.g;
    image.data[4*i + 2] = c.b;
    image.data[4*i + 3] = 255;
  });
  ctx.putImageData(image, 0, 0);

  // A simpler way to do the above, but possibly slower. keep in mind the legend width is stretched because the width attr of the canvas is 1
  // See http://stackoverflow.com/questions/4899799/whats-the-best-way-to-set-a-single-pixel-in-an-html5-canvas
  /*
  d3.range(legendheight).forEach(function(i) {
    ctx.fillStyle = colorscale(legendscale.invert(i));
    ctx.fillRect(0,i,1,1);
  });
  */

  var legendaxis = d3.axisRight()
    .scale(legendscale)
    .tickSize(6)
    .ticks(6);

  var svg = d3.select(selector_id)
    .append("svg")
    .attr("height", (legendheight) + "px")
    .attr("width", (legendwidth) + "px")
    .style("position", "absolute")
    .style("left", "-5px")
    .style("top", "20px")

  svg
    .append("g")
    .attr("transform", "translate(" + (legendwidth - margin.left - margin.right) + "," + (margin.top) + ")")
    .call(legendaxis);
};


