////Initialize Variables////
var mode = "";
var pathSVG,contentSVG,searchSVG,graphviz, dragLine, tooltip, tooltipLatent, selected, selected_id,target_attr;
var coeffs;
var rectangles = 0, ellipses = 0;
var nodes = {}, model = [];
var edges = [],dot_string;

$(document).ready(function(){ //// initialize page
	$("svg").width($("#middle_section").width())
	contentSVG = d3.select("#contentSVG")
	pathSVG = d3.select("#pathSVG")
	// searchSVG = d3.select("#searchSVG")
	graphviz = d3.select("#searchSVG").graphviz()
	var defs = contentSVG.append('svg:defs');

	// define arrow markers for graph links
    defs.append('svg:marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 7)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

	// define arrow markers for leading arrow
    defs.append('svg:marker')
      .attr('id', 'mark-end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 7)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

    dragLine = pathSVG.append('svg:path')
    	  .datum({x:0,y:0})
    	  .attr("id","dragLine")
          .attr('class', 'hidden')
          .attr('d', 'M0,0L0,0')
          .attr("stroke","black")
          .style('marker-end', 'url(#mark-end-arrow)');

    // Define the div for the tooltip
  	tooltip = d3.select("body").append("div") 
		    .attr("class", "tooltip")       
		    .style("opacity", 0)
		    .html('<ul id="tooltip_list" class="list_group" style="padding-inline-start: 0px;"></ul>')

	// Define the div for the tooltip
  	tooltipLatent = d3.select("body").append("div") 
		    .attr("class", "tooltip")       
		    .style("opacity", 0)
		    .html('<input type="text" id="latentname"></input>')

})

// function to read file and render the graph
$('#file-upload').on('change', function(e) {
	//check file length
 	if (!e.target.files.length) return;  

    var file = e.target.files[0];
    data_name = file.name;

    var ext = data_name.split('.').pop();
    if (ext != "csv") {
        file_error("File format error");
    } else {
		// read csv data          
    	var reader = new FileReader();
        reader.readAsText(file);   

        //send csv data to server using ajax
        reader.onload = function(event) {
        	//console.log(reader.result)
    	  	$.ajax({
	            url: '/read_csv',
	            data: JSON.stringify({content:reader.result,name:data_name}),
	            //contentType: JSON,
	            type: 'POST',
	            success: function(res) {
	            	// console.log(res)
	            	$("#attribute_list").empty()
	            	$("#tooltip_list").empty()
	            	$("#efa_attributes").empty()
	            	$("#search_attributes").empty()
	            	res.attributes.forEach(function(d){
	            		$("#attribute_list").append('<li class="list-group-item attr_list">'+d+'</li>')
	            		$("#tooltip_list").append('<li class="list-group-item tooltip_item" style="cursor:pointer">'+d+'</li>')
	            		$("#efa_attributes").append('<div class="form-check form-check-inline">'+
	            									'<input id="checkbox_"'+d+' type="checkbox" class="indicator form-check-input" value="'+d+'">'+
  													'<label class="form-check-label" for="checkbox_"'+d+'>'+d+'</label></div>&nbsp;')
	            		$("#search_attributes").append('<div class="form-check form-check-inline">'+
	            									'<input id="checkbox_"'+d+' type="checkbox" class="search_attr form-check-input" value="'+d+'">'+
  													'<label class="form-check-label" for="checkbox_"'+d+'>'+d+'</label></div>&nbsp;')
	            		$(".search_opt").show()
	            		$("#src_list").append("<option val="+d+">"+d+"</option>")
	            		$("#target_list").append("<option val="+d+">"+d+"</option>")

	            	})
	                		                   
	            },
	            //error function for first ajax call
	            error: function(error) {
	                console.log(error);
	            }
	        });
        }
    }
});

$(".sem_controls").on("click",function(){
	console.log($(this).attr("name"))
	mode = $(this).attr("name")
	// $(this).css("border","1px solid green")
})


$("#model").on("click",function(e){
	var posX = e.pageX - $(this).offset().left,
        posY = e.pageY - $(this).offset().top;

    target_id = e.target.id
    if(!$(e.target).hasClass('labeltext')){
    	switch(mode){
		    case 'observed':
		    	if(target_id == "model"){
		    		rectangles += 1
		    		create_rectangle(contentSVG,posX,posY,rectangles)
		    	}
		      	break;
		    case 'latent':
		    	if(target_id == "model"){
		    		ellipses += 1
		    		create_ellipse(posX,posY,ellipses)
		    	}
		      	break;
		    case 'edge':
		        break;
		    case 'edge_bid':
		        break;
		    case 'error':
		        break;
		    case 'selector':
		    	break;
		    case 'tooltip':
		    	tooltip
		    		.style("opacity","0")
		    	tooltipLatent
		    		.style("opacity","0")
		    	mode = 'observed'
		    	break;
		    default:
		      alert("No mode selected") 
		      break
		}
    }
    else{
    	selected = d3.select(e.target)
    	selected_id = selected.attr('id')
    	console.log(selected_id)
    	if(selected_id.split("_")[0] == "obsrvdtext" ){
    		mode = "tooltip"
    		tooltip
		    .style("opacity","1")
		    .style("left", (event.pageX) + "px")    
		    .style("top", (event.pageY + 28) + "px")

    	}
    	else if(selected_id.split("_")[0] == "latenttext" ){
    		mode = "tooltip"
    		$("#latentname").val("")
    		tooltipLatent
		    .style("opacity","1")
		    .style("left", (event.pageX) + "px")    
		    .style("top", (event.pageY + 28) + "px")

    	}
    	
    }
	
})

$("body").on("click",".tooltip_item",function(){
	console.log("list item clciked")
	selected.text($(this).html())
	nodes["obsrvd_"+selected_id.split("_")[1]]['name'] = $(this).html()
	// console.log(nodes["obsrvd_"+selected_id.split("_")[1]])
	// console.log(nodes)

})
$("body").on("change","#latentname",function(){
	console.log("latent")
	selected.text($(this).val())
	nodes["latent_"+selected_id.split("_")[1]]['name'] = $(this).val()
	// console.log(nodes["latent_"+selected_id.split("_")[1]])

})
$("#run").on("click",function(){
	update_model()
})

$("body").on("click",".edge",function(){
	var title = d3.select(this).selectAll('title').text();
	clicked_edge = d3.select(this);
	// console.log(title,edges)
	title = title.split("->")
	// console.log(title)
	src = title[0].trim()
	target = title[1].trim()

	var link = edges.find(function(edge){
		return edge.includes(src) && edge.includes(target)
	})
	var sep = link.includes("---")? "---":"-->";
	link = link.split(sep)
	src = link[0].trim()
	target = link[1].trim() 
	$("#src_list").val(src)
	$("#target_list").val(target)
	console.log(src,target)

})
$("#add").on("click",function(){
	src = $("#src_list").val()
	target = $("#target_list").val()
	
	edges.push(src+"-->"+target)
	update_search_dag()
	// console.log(edges)

})
$("#direct").on("click",function(){
	console.log(edges)
	src = $("#src_list").val()
	target = $("#target_list").val()
	edge_id = find_edge_index(src,target)
	edges[edge_id] = src+"-->"+target
	update_search_dag()
	// console.log(edges)

})
$("#remove").on("click",function(){
	console.log(edges)
	src = $("#src_list").val()
	target = $("#target_list").val()
	edges.splice(find_edge_index(src,target),1)
	update_search_dag()
	// console.log(edges)

})
function update_search_dag(){
	console.log(edges)
	$.ajax({
        url: '/get_dot_string',
        data: JSON.stringify({edges:edges}),
        //contentType: JSON,
        type: 'POST',
        success: function(res) {
        	console.log(res)
        	dot_string = res.dot_string;
        	// graphviz.fit("truthy")
        	// graphviz.scale(true)
        	// graphviz.height($("#searchSVG").height())
        	// graphviz.engine("neato")
        	graphviz
        		.renderDot(res.dot_str)
        	// scree_plot(res.eigenvalues)
            		                   
        },
        error: function(error) { //error function for first ajax call
            console.log(error);
        }
    });
}
function find_edge_index(src,target){
	var ind ;
	edges.forEach(function(edge,i){
		if(edge.includes(src) && edge.includes(target))
			ind = i
			
	})
	return ind;

}

function update_model(mod = null){
	if(!mod) var parsed_model = parse_model(edges)
	else var parsed_model = mod;
	console.log(parsed_model)
	$.ajax({
        url: '/sem_fit',
        data: JSON.stringify({model:parsed_model,target:target_attr}),
        //contentType: JSON,
        type: 'POST',
        success: function(res) {
        	console.log(res)
        	console.log(nodes)
        	$("#define_model").val(parsed_model)
        	var fit = Object.values(res.fit)
        	print_estimates(fit)
        	print_fit_indices(res.measures)
        	plot_line_chart(res.prediction)
        	coeffs = res.coeffs;
        	// create_model_for_export(res.coeffs)
            		                   
        },
        error: function(error) { //error function for first ajax call
            console.log(error);
        }
    });
}
function print_fit_indices(measures){
	html=""
	html += "<p class='fit_indices'> Chi-Square Value:&nbsp;"+ parseFloat(measures['chi2'][0]).toFixed(4)+"</p>"
	html += "<p class='fit_indices'> Degree of Freedom:&nbsp;"+ parseFloat(measures['dof'])+"</p>"
	html += "<p class='fit_indices'> P-value (Chi-Square):&nbsp;"+ parseFloat(measures['chi2'][1]).toFixed(4)+"</p>"
	html += "<p class='fit_indices'> Comparative Fit Indices (CFI):&nbsp;"+ parseFloat(measures['cfi']).toFixed(4)+"</p>"
	html += "<p class='fit_indices'> Goodness of Fit (GFI):&nbsp;"+ parseFloat(measures['gfi']).toFixed(4)+"</p>"
	html += "<p class='fit_indices'> Adjusted Goodness of Fit (AGFI):&nbsp;"+ parseFloat(measures['agfi']).toFixed(4)+"</p>"
	html += "<p class='fit_indices'> RMSEA:&nbsp;"+ parseFloat(measures['rmsea']).toFixed(4)+"</p>"
	html += "<p class='fit_indices'> BIC Score:&nbsp;"+ parseFloat(measures['bic']).toFixed(4)+"</p>"
	html += "<p class='fit_indices'> AIC Score:&nbsp;"+ parseFloat(measures['aic']).toFixed(4)+"</p>"
	$("#modelfit").empty()
	$("#modelfit").append(html)

}
function print_estimates(estimates){
	$("#model_fit_body").empty()
	estimates.forEach(function(r){
		$("#model_fit_body").append("<tr>");
		['lval','op','rval','Estimate','Std. Err','p-value','z-value'].forEach(function(k){
			$("#model_fit_body").append("<td>"+r[k]+"</td>")

		})
		$("#model_fit_body").append("</tr>")
		// if(r.op == "~" || r.op == "=~"){
		// 	var line = model.filter(function(d){ return (d.source.name==r.rval)&&(d.target.name==r.lval)})[0]
		// 	line.beta = parseFloat(r.Estimate.toFixed(2))
		// 	var x = (line.source.x+line.target.x+80)/2
		// 	var y = (line.source.y+line.target.y+40)/2
		// 	// create_text(x,y-20,r.Estimate.toFixed(2))
		// }
		// else if(r.op == "~~"){
  //   		if(r.lval == r.rval)
  //   			nodes[r.lval].error = parseFloat(r.Estimate.toFixed(2))

  //   	}
		
		
	})
}
function parse_model(mdl){
	console.log(nodes,mdl)
	var finalModel = ''
	var latentDict = {}, regDict = {}, temp, symbol;
	mdl.forEach(function(edge){
		if(edge.includes("-->")){
			ed = edge.split("-->")
			src = ed[0].trim()
			target = ed[1].trim()
			
			symbol = ' ~ '
			if(target in regDict)
				regDict[target] += '+ '+src
			else
				regDict[target] = target+symbol+src
			
		}
	})
	for(k in regDict){
		finalModel += regDict[k] +'\n'
	}
	finalModel += ''
	return finalModel

}
function isUnique(v){
	var exists = false;
	for(m in nodes){
		if(nodes[m].name == v){
			exists = m
			break;
		}
	}
	return exists;
}
$("#update_visual").on("click",function(e){
	
    // alert($("#define_model").val());
    var lines = $("#define_model").val().split('\n')
    x=50,y=10,rectangles=0,ellipses=0;
    for(i=0;i<lines.length;i++){
    	line= lines[i].replace(/ +?/g, '')
    	console.log(line)
    	if(line.includes("=~")){
    		vars = line.split("=~")
    		latent = vars[0]
    		ellipses += 1
    		elp_x = x+200, elp_y = y+80;
    		create_ellipse(elp_x,elp_y,ellipses,latent)
    		obs = vars[1].split("+")
    		obs.forEach(function(v){
    			var ext = isUnique(v) 
    			if(!ext){
    				rectangles += 1
	    			create_rectangle(contentSVG,x,y,rectangles,v)
	    			create_path(pathSVG,elp_x,elp_y,x+80,y+20,"latent_"+ellipses,"obsrvd_"+rectangles)
	    			y += 80

    			}
    			else create_path(pathSVG,elp_x,elp_y,nodes[ext].x+80,nodes[ext].y+20,"latent_"+ellipses,ext)
    		})
    		console.log(latent,obs)
    	}
    	else if(line.includes("~~")){
    		console.log("variance")
    	}
    	else if(line.includes("~")){
    		vars = line.split("~")
    		obs = vars[0]
    		deps = vars[1].split("+")
			
			// create_rectangle(contentSVG,600,250,rectangles,obs)
			if(!(obs in nodes)) {
				
				nodes[obs] = {"id":rectangles,"name":obs,"data_type":"Numeric"}
				rectangles += 1
			}
			deps.forEach(function(v){
				if(!(v in nodes)){
					
					nodes[v] = {"id":rectangles,"name":v,"data_type":"Numeric"}
					rectangles += 1
				}
				model.push({"source":nodes[v],"target":nodes[obs],"type":"def", "direct_type": "Directed"})
					
    		})
    			
    	}

    }
    console.log(nodes,model)

    update_model($("#define_model").val())
    
})

$("body").on("click",".attr_list",function(){
	$(".attr_list").css("background-color","none")
	$(this).css("background-color","#AED6F1")
	target_attr = $(this).html()
	console.log(target_attr)
})

$("#search_dag").on("click", function(){
	var search_variables=[];
	$(".search_attr").each(function(){
		if(this.checked) search_variables.push($(this).val())
	})
	console.log(search_variables)
	$.ajax({
        url: '/causal_search',
        data: JSON.stringify({attrs:search_variables,algo:$("#pycausal_algo").val()}),
        //contentType: JSON,
        type: 'POST',
        success: function(res) {
        	console.log(res)
        	edges = res.edges;
        	dot_string = res.dot_string;
        	graphviz.fit("truthy")
        	// graphviz.scale(true)
        	// graphviz.height($("#searchSVG").height())
        	// graphviz.engine("neato")
        	graphviz
        		.renderDot(res.dot_str)
        	// scree_plot(res.eigenvalues)
            		                   
        },
        error: function(error) { //error function for first ajax call
            console.log(error);
        }
    });

})
function circular(_nodes,w=600,h=300) {
	search_nodes = {}
    if (!_nodes || _nodes.length == 0) return;

    var c = { x: w / 2, y: h / 2 },
        r = Math.min(c.x, c.y),
        s = Math.PI * 2 / _nodes.length;
    _nodes.forEach((n, i) => {
    	var radians = s * i;
    	x = (Math.sin(radians) * r) +c.x;
    	y = (Math.cos(radians) * -r) + c.y;
    	search_nodes[n] = {"id":i,"name":n,"x":x,"y":y}
    	create_rectangle(searchSVG,x,y,30,n)
        
    });
    console.log(search_nodes)
    return search_nodes
}

$("#save_model").on("click",function(){
	
	var saved_model = {}
	saved_model['nodes'] = Object.values(nodes)
	saved_model['links'] = model
	saved_model['coeffs'] = coeffs;
	console.log(saved_model)
	$.ajax({
        url: '/save_model',
        data: JSON.stringify({model:saved_model}),
        //contentType: JSON,
        type: 'POST',
        success: function(res) {
        	console.log(res)   
        	alert("save successful")        
        },
        error: function(error) { //error function for first ajax call
            console.log(error);
        }
    });

})

//////////////////////////////////* SVG object Dragging Events*//////////////////////////////////

function dragstarted(d) {
	// $(".rectangle").data()
  obj = d3.select(this)
  if(mode == "edge" && d){
  	console.log("dukhse")
  	dragLine.datum({x:d3.event.x ,y:d3.event.y})
  	dragLine.classed('hidden', false)
  	dragLine.attr("d", 'M' + d3.event.x + ',' + d3.event.y + 'L' + d3.event.x + ',' + d3.event.y);
  } 	
}

function dragged(d) {
	obj = d3.select(this)
	if(mode == "edge"){
		pos = dragLine.datum()
		// console.log(pos)
		dragLine.attr("d", 'M' + pos.x + ',' + pos.y + 'L' + d3.event.x + ',' + d3.event.y);
	}
  	else{
  		id = obj.attr("id").split("_")[1]
  		// console.log(id)
  		d.x = d3.event.x
		d.y = d3.event.y
		if(obj.classed("latentE")){
	  		obj
	    	.attr("cx", d=> d.x)
	    	.attr("cy", d=> d.y);

	    	d3.select("#latenttext_"+id)
	    	.attr("x", d.x-20)
	    	.attr("y", d.y+5);

	  	}
	  	else{
	  		obj
	    	.attr("x", d=> d.x)
	  		.attr("y", d=> d.y);

	  		d3.select("#obsrvdtext_"+id)
	    	.attr("x", d.x+15)
	    	.attr("y", d.y+22);

	  	}
  	} 		
}

function dragended(d) {
  if(mode == "edge" && d){
  		var target_id = withinTargetObject(d3.event.x,d3.event.y)
  		// console.log(target_id)
  		if(target_id){
  			pos = dragLine.datum()
  			create_path(pathSVG,pos.x,pos.y,d3.event.x,d3.event.y,$(this).attr("id"),target_id)
  			
  		}
	}
	console.log(model)
	dragLine.classed('hidden', true)

}

function withinTargetObject(x,y){
	var within = false;
	$(".var").each(function(){
		p = d3.select(this).datum()
		tx = p.x
		ty = p.y
		// console.log($(this).attr("id"),tx,ty,x,y)
		if(Math.abs(tx-x) < 90 && Math.abs(ty-y) < 50)
		{
			// console.log("intersected!")
			within = d3.select(this).attr("id");
			return false;
		}

	})
	return within;

}

/////////////////////////////////* SVG object creation codes*//////////////////////////////////////

function create_rectangle(selectedSVG,x,y,id,v=null){
	selectedSVG.append("rect")
		.datum({x:x,y:y})
		.attr("id","obsrvd_"+id)
		.attr("class","obsrvd var")
		.attr("x",d=> d.x)
		.attr("y",d=> d.y)
		.attr("width",80)
		.attr("height",40)
		.attr("fill","white")
		.attr("stroke","black")
		.call(d3.drag()
		    .on("start", dragstarted)
		    .on("drag", dragged)
		    .on("end", dragended));

	selectedSVG.append("text")
		.datum({x:x,y:y})
		.attr("id","obsrvdtext_"+id)
		.attr("class","labeltext")
		.attr("x",d=> d.x+15)
		.attr("y",d=> d.y+22)
		.attr("width",40)
		.attr("height",20)
		.attr("fill","black")
		// .attr("stroke","black")
		.style("cursor","pointer")
		.text(function(){if(v) return v; else return "obsrvd"+id})

	if(v) nodes["obsrvd_"+id] = {"id":"obsrvd"+id,"name":v,"data_type":"Numeric","x":x,"y":y}

	else nodes["obsrvd_"+id] = {"id":"obsrvd"+id,"name":"obsrvd_"+id,"data_type":"Numeric","x":x,"y":y}
}

function create_ellipse(x,y,id,v=null){
	
	contentSVG.append("ellipse")
		.datum({x:x,y:y})
		.attr("id","latent_"+id)
		.attr("class","latentE var")
		.attr("cx",d=> d.x)
		.attr("cy",d=> d.y)
		.attr("rx",50)
		.attr("ry",20)
		.attr("fill","white")
		.attr("stroke","black")
			.call(d3.drag()
		    .on("start", dragstarted)
		    .on("drag", dragged)
		    .on("end", dragended));

	contentSVG.append("text")
		.datum({x:x,y:y})
		.attr("id","latenttext_"+id)
		.attr("class","labeltext")
		.attr("x",d=> d.x-20)
		.attr("y",d=> d.y+5)
		.attr("width",40)
		.attr("height",20)
		.attr("fill","black")
		// .attr("stroke","black")
		.style("cursor","pointer")
		.text(function(){if(v) return v; else return "latent"+id})

	if(v) nodes["latent_"+id] = {"id": "latent"+id,"name":v,"data_type":"Latent","x":x,"y":y}

	else nodes["latent_"+id]= {"id": "latent"+id,"name":"latent"+id,"data_type":"Latent","x":x,"y":y}
	

}
function create_path(selectedSVG,x1,y1,x2,y2,src,target){
	if(x2 < (x1-20) )
		model.push({"source":nodes[src],"target":nodes[target],"type":"def", "direct_type": "Directed"})
	else
		model.push({"source":nodes[src],"target":nodes[target],"type":"reg", "direct_type": "Directed"})
		

	selectedSVG.append('svg:path')
    .attr('class', 'link')
    .attr("d", 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2)
    .attr("stroke","black")
    .style('marker-end', 'url(#end-arrow)');

}

function create_text(x,y,text,fill="grey"){
	pathSVG.append('text')
			.datum({x:x,y:y,text:text})
			.attr("class","estimatetext")
			.attr("x",d=> d.x-20)
			.attr("y",d=> d.y+5)
			.attr("width",40)
			.attr("height",20)
			.attr("fill",fill)
			.text(d=>d.text)

}

/////////////////////////////////////* EFA Functions*//////////////////////////////////////

$("#efa").on("click", function(){
    $('#efa_modal')
        .modal('show')
    ;
})

$("#run_efa").on("click", function(){
	var efa_variables=[];
	$(".indicator").each(function(){
		if(this.checked) efa_variables.push($(this).val())
	})
	console.log(efa_variables)
	$.ajax({
        url: '/get_eigenvalues',
        data: JSON.stringify({attrs:efa_variables}),
        //contentType: JSON,
        type: 'POST',
        success: function(res) {
        	console.log(res)
        	scree_plot(res.eigenvalues)
            		                   
        },
        error: function(error) { //error function for first ajax call
            console.log(error);
        }
    });

})
function get_efadetails(f){
	var efa_variables=[];
	$("input[type='checkbox']").each(function(){
		if(this.checked) efa_variables.push($(this).val())
	})
	$.ajax({
        url: '/get_efadetails',
        data: JSON.stringify({attrs:efa_variables,n_factor:f}),
        //contentType: JSON,
        type: 'POST',
        success: function(res) {
        	console.log(res)
        	create_loading_table(res.col,res.loading,f)
        	// create_variance_table(res.variance,f)
            		                   
        },
        error: function(error) { //error function for first ajax call
            console.log(error);
        }
    });

}

$("#selectAll").on("click",function(){
	$(".indicator").prop("checked",true)

})
$("#selectAll_search").on("click",function(){
	$(".search_attr").prop("checked",true)

})

function create_loading_table(cols, loadings, f){
	$("#loadings").empty()
	html = '<table class="ui fixed compact table"><thead><tr><th>variable</th>'
	for(i=1;i<=f;i++) {
		html += "<th>factor"+i+"</th>"
	}
	html += "</tr></thead><tbody>"
	for(i=0;i<loadings.length;i++){
		html +="<tr><td>"+cols[i]+"</td>"
		for(j=0;j<f;j++){
			if(Math.abs(loadings[i][j]) >= 0.5)
				html += "<td style='background-color:yellow'>"+loadings[i][j]+"</td>"
			else
				html += "<td>"+loadings[i][j]+"</td>"

		}
		html += "</tr>"

	}
	html += "</tbody></table>"
	$("#loadings").append(html)
}
function create_variance_table( variance, f){
	$("#variance").empty()
	cols = ["Factor Var","Proportional Var","Cumulative Var"]
	html = '<table class="ui fixed compact table"><thead><tr><th></th>'
	for(i=1;i<=f;i++) {
		html += "<th>factor"+i+"</th>"
	}
	html += "</tr></thead><tbody>"
	for(i=0;i<variance.length;i++){
		html +="<tr><td>"+cols[i]+"</td>"
		for(j=0;j<f;j++){
			html += "<td>"+variance[i][j]+"</td>"

		}
		html += "</tr>"

	}
	html += "</tbody></table>"
	$("#loadings").append(html)
}


////// Function to draw n lines or timeseries
function plot_line_chart(data,legends=["Original","Causal DAG","Linear Regression"]){
	$("#prediction_stat").empty()
  /// create svg
  var margin = {top: 20, right: 40, bottom: 60, left: 60},
    width = $("#prediction_stat").width() - margin.left - margin.right,
    height = 260 - margin.top - margin.bottom;

  var svg = d3.select("#prediction_stat").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

  // color map
  var color = d3.scaleOrdinal(d3.schemeCategory10);

  // Add X axis
  
	var x = d3.scaleLinear()
	  .domain([0, data[0].length])
	  .range([ 0, width ]);
  
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([d3.min(data,function(d){return d3.min(d)}), d3.max(data,function(d){return d3.max(d)})])
    .range([ height, 0 ]);

  svg.append("g")
    .call(d3.axisLeft(y));

  data.forEach(function(dt,i){ // Add lines for each attributes
    svg.append("path")
      .datum(dt)
      .attr("id","path_"+i)
      .attr("fill", "none")
      .attr("stroke-width", 1.5)
      .attr("stroke",color(i))
      .attr("d", d3.line()
	    .x(function(d,k) { return x(k) })
	    .y(function(d) { return y(d) })
	    )

      // Add the Legend
    svg.append("text")
        .attr("x", 100+i*100)  // space legend
        .attr("y", -10)
        .attr("class", "legend")    // style the legend
        .style("fill", color(i))
        .text(legends[i]); 
  })

  // text label for the x axis
  svg.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (height + margin.top + 20) + ")")
      .style("text-anchor", "middle")
      .text("Observation");

  // text label for the y axis
  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Outcome");
	  

}


          
         