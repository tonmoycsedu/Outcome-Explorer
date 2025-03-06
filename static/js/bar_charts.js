function update_target_bar(original,prediction,change=0,target_set=0,target_value=false) {
  console.log(original,prediction,change)

  $("#target_bars").empty()
  data = [{"type":"Outcome","value":+prediction.toFixed(2),"color":"rgb(102, 204, 102)"}]

  if(change)
    data.push({"type":"Comparison","value":+change.toFixed(2),"color":"#F2711C"})

  // set the dimensions and margins of the graph
  var margin = {top: 25, right: 60, bottom: 20, left: 20},
      width = 170 - margin.left - margin.right,
      height = 80 - margin.top - margin.bottom;
  // set the ranges
  var y = d3.scaleBand()
            .range([height, 0])
            .padding(0.1);

  var x = d3.scaleLinear()
            .range([0, width]);
         
  // append the svg object to the body of the page
  // append a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select("#target_bars")
  // Scale the range of the data in the domains
  y.domain(data.map(function(d) { return d.type; }));
  x.domain([0, 60]);

  svg.append('line')
  .style("stroke", "black")
  .attr("x1", x(0.005))
  .attr("y1", height+10)
  .attr("x2", x(0.005))
  .attr("y2", height); 

  // append the rectangles for the bar chart
  var bars = svg.selectAll("bar")
    .data(data);
    // .attr("class", "bar")

  // bars
  // .enter().append("rect")
  //   // .attr("x", function(d) { return x(d.type); })
  //   .attr("width", function(d) {return x(0); } )
  //   .attr("y", function(d) { return y(d.type); })
  //   .attr("height", y.bandwidth())
  //   .attr("fill",function(d) {return d.color});

  bars
  .enter().append("rect")
    // .attr("x", function(d) { return x(d.type); })
    .attr("width", function(d) {return x(d.value); } )
    .attr("y", function(d) { return y(d.type); })
    .attr("height", y.bandwidth())
    .attr("fill",function(d) {return d.color});

  bars
  .enter().append("text")
    .text(function(d) {
      return d.value.toFixed(2)+"K";
    })
    .attr("y", function(d) {return y(d.type) + 10;})
    .attr("x", width+10)
    .style('font-size',"12px")

  // add the x Axis
  svg.append("g")
    .attr("transform", "translate(0," + (height+10) + ")")
    .call(d3.axisBottom(x).ticks(3));

  // add the y Axis
  svg.append("g")
    // .attr("transform", "translate(0,"+10+")")
    .call(d3.axisLeft(y));
   
}


function feasibility_bars(value,change=false){
  // res = get_class(cls.toFixed(2))

  $("#feasibility_bars").empty()
  data = [{"type":"Persona1","value":+value.toFixed(2),"color":"rgb(102, 204, 102)"}]

  if(change)
    data.push({"type":"Persona2","value":+change.toFixed(2),"color":"#F2711C"})

  // set the dimensions and margins of the graph
  var margin = {top: 5, right: 60, bottom: 40, left: 70},
      width = 170 - margin.left - margin.right,
      height = 80 - margin.top - margin.bottom;
  // set the ranges
  var y = d3.scaleBand()
            .range([height, 0])
            .padding(0.1);

  var x = d3.scaleLinear()
            .range([0, width]);
         
  // append the svg object to the body of the page
  // append a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select("#feasibility_bars").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  // Scale the range of the data in the domains
  y.domain(data.map(function(d) { return d.type; }));
  x.domain([0, 1]);

  // append the rectangles for the bar chart
  var bars = svg.selectAll("bar")
    .data(data);
    // .attr("class", "bar")

  bars
  .enter().append("rect")
    // .attr("x", function(d) { return x(d.type); })
    .attr("width", function(d) {return x(d.value); } )
    .attr("y", function(d) { return y(d.type); })
    .attr("height", y.bandwidth())
    .attr("fill",function(d) {return d.color});

  bars
  .enter().append("text")
    .text(function(d) {
      return d.value.toFixed(2);
    })
    .attr("y", function(d) {
        return y(d.type) + 10;
    })
    .attr("x", width+10)
    .style('font-size',"10px")
    
  // add the x Axis
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(3));

  // add the y Axis
  svg.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (height+35) + ")")
      .style("text-anchor", "middle")
      .style("opacity","0.7")
      .text("Feasibility Score");
   
}


// create continuous color legend
function horizontal_continuous(selector_id, colorscale,green_line,orange_line) {
  var legendheight = 120,
      legendwidth = $("#persona_div").width(),
      margin = {top: 30, right: 30, bottom: 50, left: 50};

  var canvas = d3.select(selector_id)
    .append("canvas")
    .attr("height", 1)
    .attr("width", legendwidth - margin.left - margin.right)
    .style("height", (legendheight - margin.top - margin.bottom) + "px")
    .style("width", (legendwidth - margin.left - margin.right) + "px")
    .style("border", "1px solid #000")
    .style("position", "absolute")
    .style("top", (legendheight/3) + "px")
    .style("left", (margin.left) + "px")
    .node();

  var ctx = canvas.getContext("2d");

  var legendscale = d3.scaleLinear()
    .range([1, legendwidth - margin.left - margin.right])
    .domain(colorscale.domain());

  // image data hackery based on http://bl.ocks.org/mbostock/048d21cf747371b11884f75ad896e5a5
  var image = ctx.createImageData(legendwidth, 1);
  d3.range(legendwidth).forEach(function(i) {
    var c = d3.rgb(colorscale(legendscale.invert(i)));
    image.data[4*i] = c.r;
    image.data[4*i + 1] = c.g;
    image.data[4*i + 2] = c.b;
    image.data[4*i + 3] = 255;
  });
  ctx.putImageData(image, 0, 0);

  var canvas1 = d3.select(selector_id)
    .append("canvas")
    .attr("height", 1)
    .attr("width", legendwidth - margin.left - margin.right)
    .style("height", (legendheight - margin.top - margin.bottom+20) + "px")
    .style("width", (legendwidth - margin.left - margin.right) + "px")
    // .style("border", "1px solid #000")
    .style("position", "absolute")
    .style("top", (legendheight/3-10) + "px")
    .style("left", (margin.left) + "px")
    .node();
  var ctx1 = canvas1.getContext("2d");

  // // append the svg object to the body of the page
  var svg = d3.select(selector_id)
    .append("svg")
      .attr("width", legendwidth )
      .attr("height", legendheight+margin.bottom)
      .style("position", "absolute")
      .style("top", (0) + "px")
      .style("left", (0) + "px")
    .append("g")
      // .attr("transform",
      //       "translate("+margin.left +","+ (margin.top) + ")");

  // add the x Axis
  var x = d3.scaleOrdinal()
            .domain(["Rare", "Moderately Common", "Common" ])
            .range([margin.left, (legendwidth  - margin.right+margin.left)/2,legendwidth  - margin.right]);
  var x1 = d3.scaleLinear()
              .domain([0,1])
              .range([2,legendwidth - margin.left - margin.right-2])

  var y = d3.scaleLinear()
            .range([legendheight-margin.left-margin.right+20, 0])
            .domain([0, 1]);

  svg.append("g")
      .attr("transform", "translate(0," + (legendheight-margin.bottom+20) + ")")
      .call(d3.axisBottom(x));

  svg.append("text")             
      .attr("transform",
            "translate(" + (legendwidth)/2 + " ," + 
                           (margin.top)/2 + ")")
      .style("text-anchor", "middle")
      .style("opacity","1")
      .text("Realism Meter");

  //   // text label for the x axis
  // svg.append("text")             
  //     .attr("transform",
  //           "translate(" + (legendwidth - margin.left - margin.right)/2 + " ," + 
  //                          ((legendheight- margin.bottom) +50) + ")")
  //     .style("text-anchor", "middle")
  //     .style("opacity","0.5")
  //     .text("How does your chosen persona compare to those of other people?");

  svg.append("text")             
      .attr("x", (legendwidth - margin.left - margin.right)/2 )
      .attr("y", legendheight ) 
      .style("text-anchor", "middle")
      .style("opacity","0.5")
      .attr("dy", 0)//set the dy here
      .text("How does the current profile compare to previous profiles?")
      .call(wrap,legendwidth - margin.left - margin.right)

  // <div style="position: absolute; top:690px;left:450px;z-index: 2;opacity:0.5">Group</div>
  if(school_category == 4)
    html_str = '<option value="4" selected>All</option>';
  else
    html_str = '<option value="4">All</option>';

  // for(i=1;i<4;i++){
  //   if(i == school_category)
  //     html_str += '<option value="'+i+'" selected>Group '+i+'</option>'
  //   else
  //     html_str += '<option value="'+i+'">Group '+i+'</option>'
  // }
          
  svg.append("foreignObject")
      .attr("transform",
            "translate(" + (legendwidth/2+20) + " ," + 0 + ")")
      .attr("width", '150px')
      .attr("height", '50px')
      .html('<select id="school_category">'+html_str+'</select')

  if(green_line){
    ctx1.beginPath();
    ctx1.moveTo(x1(green_line), 0);
    ctx1.lineTo(x1(green_line), 150);
    ctx1.lineWidth = 3;
    ctx1.strokeStyle = "green";
    ctx1.stroke();
    // svg.append('line')
    // .style("stroke", "green")
    // .style("stroke-width", 3)
    // .attr("opacity", 1)
    // .attr("x1", x1(green_line))
    // .attr("y1", y(0))
    // .attr("x2", x1(green_line))
    // .attr("y2", y(1)); 
  }
  if(orange_line){
    ctx1.beginPath();
    ctx1.moveTo(x1(orange_line), 0);
    ctx1.lineTo(x1(orange_line), 150);
    ctx1.lineWidth = 3;
    ctx1.strokeStyle = "orange";
    ctx1.stroke();
    // svg.append('line')
    // .style("stroke", "orange")
    // .style("stroke-width", 3)
    // .attr("x1", x1(orange_line))
    // .attr("y1", y(0))
    // .attr("x2", x1(orange_line))
    // .attr("y2", y(1)); 
  }

};


function feasibility_chart(div_id, data, green_line=false, orange_line=false){
  console.log(data)
  $(div_id).empty()
  var colorScale1 = d3.scaleSequential().domain([0, 1]).interpolator(function(t){ return d3.interpolateBlues(t/4)});
  horizontal_continuous(div_id, colorScale1,green_line,orange_line);
  
}

function feasibility_chart1(div_id, data, green_line=false, orange_line=false){
  console.log(data)
  $(div_id).empty()
  // set the dimensions and margins of the graph
  var margin = {top: 30, right: 30, bottom: 50, left: 50},
      width = 380 - margin.left - margin.right,
      height = 180 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3.select(div_id)
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  // add the x Axis
  var x = d3.scaleLinear()
            .domain([d3.min(data,function(d){return d.x}), 1])
            .range([0, width]);

  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(4));

  // add the y Axis
  var y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(data,function(d){return d.y})]);
  svg.append("g")
      .call(d3.axisLeft(y).ticks(4));

  // Plot the area
  // svg.append("path")
  //     .attr("class", "mypath")
  //     .datum(data)
  //     .attr("fill", "lightgrey")
  //     .attr("opacity", ".8")
  //     .attr("stroke", "#000")
  //     .attr("stroke-width", 1)
  //     .attr("stroke-linejoin", "round")
  //     .attr("d",  d3.line()
  //       .curve(d3.curveBasis)
  //         .x(function(d) { return x(d.x); })
  //         .y(function(d) { return y(d.y); })
  //     );

  // Add the area
  svg.append("path")
    .datum(data)
    .attr("fill", "lightgrey")
    .attr("stroke", "#000")
    .attr("stroke-width", .1)
    .attr("d", d3.area()
      .curve(d3.curveBasis) 
      .x(function(d) { return x(d.x) })
      .y0(y(0))
      .y1(function(d) { return y(d.y) })
      )


  svg.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (-10) + ")")
      .style("text-anchor", "middle")
      .style("opacity","0.7")
      .text("Feasibility Score");

  //    // // text label for the y axis
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x",-50)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("opacity","0.5")
      .text("Density"); 

    // text label for the x axis
  svg.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (height + margin.top + 15) + ")")
      .style("text-anchor", "middle")
      .style("opacity","0.5")
      .text("Probability");

  if(green_line){
    svg.append('line')
    .style("stroke", "green")
    .style("stroke-width", 3)
    .attr("x1", x(green_line))
    .attr("y1", y(0))
    .attr("x2", x(green_line))
    .attr("y2", y(d3.max(data,function(d){return d.y}))); 
  }
  if(orange_line){
    svg.append('line')
    .style("stroke", "orange")
    .style("stroke-width", 3)
    .attr("x1", x(orange_line))
    .attr("y1", y(0))
    .attr("x2", x(orange_line))
    .attr("y2", y(d3.max(data,function(d){return d.y}))); 
  }
}




