

$("body").on("click",'#play',function(){
	isProbed = true;
	play_probe()
	// update_scatter_plot()
})
$("body").on("click","#commit",function(){
	console.log("stopped!!!")
	if(isProbed){
		commit_probe()
		// $(".change_percentage").removeClass('blue')
	}
})
$("body").on("click","#stop",function(){
	console.log("stopped!!!")
	if(isProbed){
		stop_probe()
		// update_scatter_plot()
		// $(".change_percentage").removeClass('blue')
	}
})

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

function play_probe(probe_values = false, state_update=true){
	// console.log(compare_knob_values)
	isPlayed = true
	if(!probe_values){

		compare_node_values = copy_object(node_values)
		// compare_knob_values = copy_object(knob_values)
	}
	// else
	// 	compare_node_values = copy_object(probe_values)
	$('.change_knobs').each(function(i, obj) {
		
	    id = $(this).attr('id').split("_")[0]
        node = active_model.nodes.filter(function(d){ return d.id == id})[0]
	    
	    if(!probe_values){
	    	v = compare_node_values[node.name]
	    	new_v = v*node.std+node.mean	
	    }
	    else{
	    	new_v = probe_values[node.name]
	    	compare_node_values[node.name] = (new_v - node.mean)/node.std
	    	node.intervened = 1
	    }
	    compare_knob_values[node.name] = new_v
	    $(this).roundSlider({
	    	value:new_v,
	    	handleSize:8,
            readOnly:false,
	    })
	    $("#"+id+"_changeinput").val(formatValue(new_v))
	    // $("#"+index+"_latentvalue1").show()
	    // $(this).roundSlider("setValue", new_v)
	})
	update_alternate_node_values()
	update_target(compare_knob_values[target_name],true)
	// update_latent_variables()
	// compare_val = regression(compare_node_values, true)
	// if(state_update)
	// 	insert_state()
	isPlayed = false
	$('#commit').show()
	$("#stop").show()
	if(!probe_values)
		update_scatter_plot()
	// console.log(compare_knob_values)
	// probe_target_value = pred
	// console.log(probe_target_value)
}
function commit_probe(){
	isPlayed = true
	node_values = copy_object(compare_node_values)
	$('.main_knobs').each(function(i, obj) {
		
	    id = $(this).attr('id').split("_")[0]
        node = active_model.nodes.filter(function(d){ return d.id == id})[0]
	    v = node_values[node.name]
	    new_v = v*node.std+node.mean
	    knob_values[node.name] = new_v
	    $(this).roundSlider({
	    	value:new_v,
            readOnly:false,
	    })
	    
	})
	update_main_node_values()
	update_target(knob_values[target_name])
	// insert_state()
	isPlayed = false
	update_scatter_plot()
	// console.log(knob_values)
	// probe_target_value = pred
	// console.log("saved target:" ,probe_target_value)
}
function stop_probe(state_update=true){
	isPlayed = true
	isProbed = false;
	
	$('.change_knobs').each(function(i, obj) {
		id = $(this).attr('id').split("_")[0]
        node = active_model.nodes.filter(function(d){ return d.id == id})[0]
		dmin = parseFloat($(this).attr("min"))
		new_v =+ (dmin-node.mean)/node.std
		// console.log(node_name,dmin)
		compare_node_values[node.name] = new_v
		compare_knob_values[node.name] = dmin
		// $(this).roundSlider("setValue",dmin)
		$(this).roundSlider({
	    	value:dmin,
	    	handleSize:1,
            readOnly:true,
	    })
	    $("#"+id+"_changeinput").val("")
	    // $("#"+index+"_latentvalue1").hide()
	})
	compare_val = 0
	update_main_node_values()
	update_target(knob_values[target_name])
	// prediction_val = regression(node_values)
	isClicked = false
    d3.select('.compared').attr('r','3.5').style('fill', saved_color).classed('compared',false)
    compare_index = -1
    d3.select("#tooltip1").classed("hidden", true); 
    // if(state_update)
    // 	insert_state()
    isPlayed = false
    // update_latent_variables()
    $('#commit').hide()
    $("#stop").hide()
    update_scatter_plot()
    // console.log(compare_node_values)
    // console.log(knob_values)
	// probe_target_value = false
}

