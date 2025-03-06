
function line_chart(div_id,data){
	$("#"+div_id).empty();
	console.log("line data:",data)

	var margin = {top: 30, right: 30, bottom: 100, left: 50}
	  , width = 3*$("#persona_div").width()/4 - margin.left - margin.right // Use the window's width 
	  , height = $("#persona_div").height()/3-50 - margin.top - margin.bottom; // Use the window's height
	
	var axisDomain = data.map(function(d) { return d.time; })
	axisDomain.unshift(0)
	var xScale = d3.scalePoint()
	    .domain(axisDomain) // input
	    .range([0, width]); // output

	var yScale = d3.scaleLinear()
	    .domain([0, 60]) // input 
	    .range([height, 0]); // output 

	// 7. d3's line generator
	var line = d3.line()
	    .x(function(d) { return xScale(d.time); }) // set the x values for the line generator
	    .y(function(d) { return yScale(d.target) }) // set the y values for the line generator 
	    // .curve(d3.curveMonotoneX) // apply smoothing to the line

	var svg = d3.select("#"+div_id).append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// 3. Call the x axis in a group tag
	svg.append("g")
	    .attr("transform", "translate(0," + height + ")")
	    .call(d3.axisBottom(xScale).ticks(20)); // Create an axis component with d3.axisBottom
	// Add the Y Axis
	  svg.append("g")
	  	  .attr("transform", "translate(0,0)")
	      .call(d3.axisLeft(yScale).ticks(3));

	// 9. Append the path, bind the data, and call the line generator 
	svg.append("path")
	    .datum(data) // 10. Binds data to the line 
	    .attr("class", "line") // Assign a class for styling 
	    .style("fill",'none')
	    .style("stroke","rgb(102, 204, 102)")
	    .attr("d", line); // 11. Calls the line generator 

	// 12. Appends a circle for each datapoint 
	svg.selectAll(".dot")
	    .data(data)
	  .enter().append("circle") // Uses the enter().append() method
	    .attr("class", "dot") // Assign a class for styling
	    .style("fill","rgb(102, 204, 102)")
	    .attr("cx", function(d, i) { return xScale(d.time) })
	    .attr("cy", function(d) { return yScale(d.target) })
	    .attr("r", function(d){ return d.node_size})
	  .on("click", function(d) {
	      revert_main_state(d.time)
       })
	  .on("mouseover", function(d) {
	  		// xPosition = "350"
	  		// yPosition = "120"
     //        d3.select("#tooltip2")
     //          .style("left", xPosition+ "px")
     //          .style("top", yPosition+ "px")
     //          .text("Target Value: "+d.target.toFixed(2));
     //        $("#tooltip2").css("background-color","rgb(102, 204, 102)")
     //        d3.select("#tooltip2").classed("hidden", false);
	        
       })
       .on("mouseout", function() {
     	 
            d3.select("#tooltip2").classed("hidden", true); 
     	 
       });

    
    	var line1 = d3.line()
	    .x(function(d) { return xScale(d.time); }) // set the x values for the line generator
	    .y(function(d) { 
	    	if (typeof d.compare_value == 'undefined')
	    		return yScale(0)
	    	else
	    		return yScale(d.compare_value) }) // set the y values for the line generator 
	    // .curve(d3.curveMonotoneX) // apply smoothing to the line

    	// 9. Append the path, bind the data, and call the line generator 
		svg.append("path")
		    .datum(data) // 10. Binds data to the line 
		    .attr("class", "line") // Assign a class for styling 
		    .style("fill",'none')
		    .style("stroke","#F2711C")
		    .attr("d", line1); // 11. Calls the line generator 

		// 12. Appends a circle for each datapoint 
		svg.selectAll(".change_dot")
		    .data(data)
		  .enter().append("circle") // Uses the enter().append() method
		    .attr("class", "change_dot") // Assign a class for styling
		    .style("fill","#F2711C")
		    .attr("cx", function(d, i) { return xScale(d.time) })
		    .attr("cy", function(d) { 
			    if (typeof d.compare_value == 'undefined')
		    		return yScale(0)
		    	else
		    		return yScale(d.compare_value)})
		    .attr("r", function(d){return d.node_size1})
		  .on("click", function(d) {
		      revert_alternate_state(d.time)
	       })
		  .on("mouseover", function(d) {
		  		// xPosition = "350"
	  			// yPosition = "120"
	     //        d3.select("#tooltip2")
	     //          .style("left", xPosition+ "px")
	     //          .style("top", yPosition+ "px")
	     //          .text(function(){
	     //          	if (typeof d.compare_value != 'undefined')
	     //          		return "Target Value: "+d.compare_value.toFixed(2)
	     //          	else return "Not initialized!"});
	     //        $("#tooltip2").css("background-color","#F2711C")
	     //        d3.select("#tooltip2").classed("hidden", false);
		        
	       })
	       .on("mouseout", function() {
	     	 
	            d3.select("#tooltip2").classed("hidden", true); 
	     	 
	       });

    
    // text label for the x axis
    // svg.append("text")             
    //   .attr("x",width/2)
    //   .attr("y",height+40)
    //   .style("text-anchor", "middle")
    //   .style("opacity","0.2")
    //   .text("Time");

    // // // text label for the y axis
    // svg.append("text")
    //   .attr("transform", "rotate(-90)")
    //   .attr("y", width/2)
    //   .attr("x",height / 2)
    //   .attr("dy", "1em")
    //   .style("text-anchor", "middle")
    //   .style("opacity","0.2")
    //   .text("Outcome"); 

  svg.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (-10) + ")")
      .style("text-anchor", "middle")
      .style("opacity","1")
      .text("Evolution Tracker");
    // text label for the x axis
  // svg.append("text")             
  //     .attr("transform",
  //           "translate(" + (width/2) + " ," + 
  //                          (height + margin.top + 10) + ")")
  //     .style("text-anchor", "middle")
  //     .style("opacity","0.5")
  //     .text("Time");

  // text label for the y axis
  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("opacity","0.5")
      .text("Outcome"); 

   // /   // text label for the x axis
  // svg.append("text")             
  //     .attr("x", (width/2) )
  //     .attr("y", (height + margin.top + 15) ) 
  //     .style("text-anchor", "middle")
  //     .style("opacity","0.5")
  //     .attr("dy", 0)//set the dy here
  //     .text("This line monitors your success in evolving your profile's outcome. Click on any dot to redo/undo changes to your profile.")
  //     .call(wrap,width)
  svg.append("foreignObject")
      .attr("transform",
            "translate(" + (width/2+40) + " ," + 
                           (-30) + ")")
      .attr("width", '150px')
      .attr("height", '50px')
      // .attr("class","svg_buttons") 
      .html("<button id='save_state' class='ui mini primary button' >Save Profiles</button>'")

    svg.append("foreignObject")             
      .attr("x", 0-margin.left )
      .attr("y", (height + margin.top + 15) ) 
      .attr("width",3*$("#persona_div").width()/4)
      .attr("height","100px")
      .style("text-anchor", "left")
      .style("opacity","0.5")
      .attr("dy", 0)
      .html("This line monitors the changes in the outcome. Click on any dot to redo/undo changes.")

}

function scree_plot(df)
{
	$("#scree_plot").empty()
	data = []
	for(i=0;i<df.length;i++) data.push({"index":i+1,"eigenvalue":df[i]})
    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 20, bottom: 50, left: 50},
        width = 500 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    // set the ranges
    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // define the line
    var valueline = d3.line()
        .x(function(d) { return x(d.index); })
        .y(function(d) { return y(d.eigenvalue); });

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("#scree_plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");
    // Scale the range of the data
      x.domain([0, d3.max(data, function (d) {return d.index})+1]);
      y.domain([0, d3.max(data, function(d) { return d.eigenvalue; })+2]);

      // Add the valueline path.
      svg.append("path")
          .data([data])
          .attr("class", "line")
          .attr("fill","none")
          .attr("stroke","steelblue")
          .attr("d", valueline);
          
      // Add the scatterplot
      svg.selectAll("dot")
          .data(data)
        .enter().append("circle")
          .attr("r", 5)
          .attr("cx", function(d) { return x(d.index); })
          .attr("cy", function(d) { return y(d.eigenvalue); })
          .attr('fill',"steelblue")
          .style("cursor","pointer")
          .on("mouseover", function(d) {
            $(this).attr("fill","orangered")
          })
          .on("click", function(d) {
            k = d.index
            console.log(k)
            get_efadetails(k)
          })
          .on("mouseout", function(d) {
            $(this).attr("fill","steelblue")
          });

      // Add the X Axis
      svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));

      // Add the Y Axis
      svg.append("g")
          .call(d3.axisLeft(y));

      //text labels for x axis
      svg.append("text")             
          .attr("transform",
                "translate(" + (width/2) + " ," + 
                               (height + margin.top + 10) + ")")
          .style("text-anchor", "middle")
          .text("Factors");

      // text label for the y axis
      svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - margin.left)
          .attr("x",0 - (height / 2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("Eigen Value");

      $( "#go_button" ).prop( "disabled", true );
}