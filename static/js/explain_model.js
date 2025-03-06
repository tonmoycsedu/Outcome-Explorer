/**
 * Global variables
 */
var selected_attrs = [], selected_attr, selected_v, selected_index, stepSizes,

dmin, dmax, compare_index = -1,

selected_paths = [],all_paths = [],

change_percentage, change_target, sensitivity=0,

states=[],time=0,

persona_list, 

pca_components, neighbors,axis, scale=[],

isClicked = false,saved_color = false,
change_type = false, hoverOption = false,
isProbed=false, isPlayed=false,probe_target_value= false, show_axis=false,
global_flag = false, dialed = false,
prev_state=false,
school_category=4,

node_values = {}, compare_node_values = {}, 
edge_values = {}, latent_edges = {}, beta_values = {}, 
knob_values= {}, compare_knob_values= {},
exgeneous = [], endegenous = [], layers=[],

targetId,sourceId,
target_mean,target_std,target_val=0, 
prediction_val, compare_val, predicted_vals = [],

target_name = "MED_PRICE",
model_type = "regression",
active_model = {},_model,
active_density = {}, ly; 

//========== Interaction Components ====================================
$('body #attributes').dropdown('refresh')

/**
 * on click event for showing the DAG. on click update the causal model and persona list.
 */
$("#go").on("click",function(){
    selected_attrs = $(".multiple").dropdown("get value")
    console.log(selected_attrs)
	$.ajax({
        url: '/see_model',
        data: JSON.stringify({attrs:selected_attrs,target:target_name,model_type:model_type}),
        type: 'POST',
        success: function(response){
            console.log(response);
            persona_list = response.rows
            $('#change_settings').show()
            $(".description").show()
            update_network(JSON.parse(response.model));  
            // active_density = Object.values(response.histogram)
            // feasibility_chart("#feasibility_bars",active_density)
            if(model_type == 'regression')
                update_persona_list(response.indices,response.keys,response.classes)  
            else 
                update_persona_list(response.indices,response.indices,response.classes) 
            if(baseline){
                $(".ui.form").hide()
                $(".causal").hide()
            }           
        },
        error: function(error){
            console.log("error !!!!");
        }
    });
});

window.onload = function(){
    // selected_attrs = ["gre","toefl","sop","lor","cgpa","research","admit"]
    selected_attrs = ["CRIME_RATE","NITRIC_OXIDE","ROOM_PER_DWELLING","PERCENTAGE_OLD_HOUSE",
                    "DISTANCE_FROM_CITY","ACCESSIBILTY_TO_HWY","PROPERTY_TAX","LOWER_STATUS_POP","INDUSTRIALIZATION","PUPIL_TEACHER_RATIO","MED_PRICE"]    
        
    stepSizes = {"CRIME_RATE":"0.01","NITRIC_OXIDE":".001","ROOM_PER_DWELLING":"0.01","PERCENTAGE_OLD_HOUSE":"0.01",
                    "DISTANCE_FROM_CITY":"0.01","ACCESSIBILTY_TO_HWY":"0.01","PROPERTY_TAX":"0.01",
                    "LOWER_STATUS_POP":"1","INDUSTRIALIZATION":"0.1","PUPIL_TEACHER_RATIO":"0.1"}   

    // selected_attrs = ["Pregnancies","Glucose","BloodPressure","SkinThickness",
    //                 "Insulin","BMI","DiabetesPedigreeFunction","Age","hasDiabetes"]    
    // stepSizes = {"Pregnancies":"1","Glucose":".001","BloodPressure":"0.01","SkinThickness":"0.01",
    //                 "Insulin":"0.01","BMI":"0.01","DiabetesPedigreeFunction":"0.01",
    //                 "Age":"1"}    
        
    $.ajax({
        url: '/see_model',
        data: JSON.stringify({pdag_load:active_model,attrs:selected_attrs,target:target_name,model_type:model_type}),
        type: 'POST',
        success: function(response){
            // console.log(response);
            persona_list = response.rows
            load_dag()
            update_network(JSON.parse(response.model));  
            if(model_type == 'regression')
                update_persona_list(response.indices,response.keys,response.classes)  
            else 
                update_persona_list(response.indices,response.indices,response.classes)         
        },
        error: function(error){
            console.log("error !!!!");
        }
    });
}

function load_variable_desc(selected_attrs){
    for(i=0;i<selected_attrs.length;i++){
        attr = selected_attrs[i]
        $("#desc_body").append("<tr><td>"+attr+"</td><td>"+attrs_desc[attr]+"</td></tr>")
    }
}

/**
 * on click event for persona selection
 */
function change_sample(value, text, $selectedItem) {
    console.log(value, text)
    compare_index = -1
    selected_index =+ value
    num_of_points = $("#myRange").val()
    assign_vals(+value, +num_of_points)
}

/**
 * categorical value change event handler
 */
$('body').on("change", '.dd', function(){   
    hoverOption = false
    console.log("fired!!")
    v =+ this.value;
    node_name = $(this).attr('name')
    node_values[node_name] = 1
    compare_node_values[node_name] = 1
    prediction_val = regression(node_values)   
    compare_val =  regression(compare_node_values,change_probe=true);   
});


$('#update').on('click',function(){
    $.ajax({
        url: '/show_dag',
        data: JSON.stringify({pdag:active_model,attrs:selected_attrs,target:target_name,model_type:model_type}),
        type: 'POST',
        success: function(response){
            console.log(response);
            update_network(JSON.parse(response.model));      
        },
        error: function(error){
            console.log("error !!!!");
        }
    });
})

$('#myRange').on('change', function(){
     update_neighbour_info(update_scatter = true, update_bars=false)
});

//========== Computation ====================================
/**
 * get the data for a persona and add those values to the path analysis
 */
function assign_vals(row_index, num_of_points=false){
    $.ajax({
        url: '/get_row',
        data: JSON.stringify({attrs:selected_attrs,index:row_index, compare_index:compare_index, num_of_points:num_of_points}),
        type: 'POST',
        success: function(response){
            console.log("success !!!");
            console.log(response)
            neighbors = Object.values(response.neighbours)
            axis = Object.values(response.axis)
            // scatterplot(neighbors,axis)
            pca_components = Object.values(response.pca_elements.components)
            scale.push(response.pca_elements.scalex)
            scale.push(response.pca_elements.scaley)

            // grouped_bar_chart(Object.values(response.features),true)
            res = response.row[0]
            for(var key in res){
                if(key != target_name){
                    // console.log('input[name='+key+']')
                    if($('div[name='+key+']').length){
                        id = $('div[name='+key+']').attr('id').split('_')[0]
                        node = active_model.nodes.filter(function(d){ return d.id == id})[0]
                        val =+ res[key]
                        // console.log(key,val)
                        node_values[key] =+ (val-node.mean)/node.std
                        knob_values[key] =+ val
                        node.intervened = node.parents.size ? 1:0;
                        $('div[name='+key+']').roundSlider('setValue',res[key]);
                    }
                }
            }
            console.log(node_values)
            target_val = res[target_name]
            prediction_val = false
            change_type = false
            update_main_node_values()
            update_target(knob_values[target_name])
            global_flag = true
            time += 1
            states.push({'time':time,'nodes':copy_object(node_values), 
                            'compare_nodes': copy_object(compare_node_values), 'node_status':active_model.nodes,
                            'target':prediction_val, 'compare_value':compare_val,'node_size':5, 'node_size1':5})
            circle_size(time,true,true)
            line_chart("line_chart",states)
            feasibility_score()
            // update_latent_variables()
            update_scatter_plot() 
        },
        error: function(error){
            console.log("error !!!!");
        }
    });
}

function get_persona1_data(){
    console.log("updating scatter plot")
    arr = []
    arr1 = []
    attr_values = {}
    attr_values1 = {}
    for(var name in node_values){
        if(name != target_name){
            arr.push(node_values[name])
            arr1.push(compare_node_values[name])
            attr_values[name] = knob_values[name]
            attr_values1[name] = compare_knob_values[name]
        }
    }
    pca = [], pca1=[]
    for(i=0; i < pca_components.length;i++){
        component = pca_components[i]
        sum =0, sum1=0
        for(j=0;j<component.length;j++){
            // console.log(j)
            sum += component[j]*arr[j]
            sum1 += component[j]*arr1[j]

        }
        pca.push(sum*scale[i])
        pca1.push(sum1*scale[i])
    }
    // scatterplot(neighbors,axis)
    // console.log(arr,pca_components,pca)
    return [pca,attr_values,pca1,attr_values1]
}

function update_scatter_plot(){
    transformed_data = get_persona1_data()
    var new_neibors = neighbors.slice(0)
    new_neibors.push({"Key":-1,"PC1":transformed_data[0][0],"PC2":transformed_data[0][1],"attributes":transformed_data[1], "index":-1,"value":-1 })
    // console.log(new_neibors)
    if(isClicked || isProbed)
        new_neibors.push({"Key":-1,"PC1":transformed_data[2][0],"PC2":transformed_data[2][1],"attributes":transformed_data[3], "index":-2,"value":-1 })
    scatterplot(new_neibors,axis)
}

function get_scatterplot_data( val,num_of_points=false){
    $.ajax({
        url: '/get_pca',
        data: JSON.stringify({attrs:selected_attrs, val:val, num_of_points:num_of_points}),
        type: 'POST',
        success: function(response){
            // console.log("success !!!");
            console.log(response)
            neighbors = Object.values(response.neighbours)
            axis = Object.values(response.axis)
            // scatterplot(neighbors,axis)
            pca_components = Object.values(response.pca_elements.components)
            scale.push(response.pca_elements.scalex)
            scale.push(response.pca_elements.scaley)
            update_scatter_plot()
            // d3.select("#target_val").text(res[target_name])  
        },
        error: function(error){
            console.log("error !!!!");
        }
    });
}
/**
 * update causal model, initialize node values, add event listener to knobs,
 node mouseover and node mouseout
 */
function update_network(response_model){
    selected_paths = []
    active_model = response_model
    
    targetId = find_nodeId(target_name)
    // console.log(active_model,targetId)
    if(model_type == 'regression'){
        target_mean = active_model.nodes[targetId].mean
        target_std = active_model.nodes[targetId].std
    }
    //load the model in the canvas using d3
    console.log("Active Model: ", active_model)
    cg.clear()
    active_model = cg.load($.extend(true, {}, active_model), cg.mode());
    // active_model = _model
    initialize()
}

/**
 * intialize node and edge values with beta values
 */
function initialize(){
    node_values = {} 
    compare_node_values = {}
    beta_values = {} 
    knob_values= {}
    compare_knob_values= {}

    active_model.nodes.forEach(function(node){
        node.intervened = 0
        node_values[node.name] = (node.min - node.mean)/node.std
        compare_node_values[node.name] = (node.min - node.mean)/node.std
        knob_values[node.name] = node.min
        compare_knob_values[node.name] = node.min
    })
    // create_target_bar()
    update_main_node_values()
    update_target(knob_values[target_name])
    states = []
    time = 1
    states.push({'time':time,'nodes':copy_object(node_values), 
                    'compare_nodes': copy_object(compare_node_values), 'node_status':active_model.nodes,
                    'target':prediction_val, 'compare_value':compare_val,'node_size':5, 'node_size1':5})
    line_chart("line_chart",states)
    
    feasibility_score()
    get_scatterplot_data(prediction_val,$("#myRange").val())
    // regression(node_values)
}
function _topo_order(_nodes, _links) {
    var visited = new Set(),
        layers = [];
    while (visited.size < _nodes.length) {
        var tar_set = new Set(_links.map(l => l.target)),
            new_layer = _nodes.filter(n => !visited.has(n) && !tar_set.has(n));
        if (!new_layer.length)
            new_layer = [_nodes.find(n => !visited.has(n))];
        layers.push(new_layer);
        new_layer.forEach(n => visited.add(n));
        _links = _links.filter(l => !visited.has(l.source));
    }
    // console.log("layers:", layers)
    return layers;
}
function update_node_values(std_values,org_values,orange=false){
    // console.log("changing node values")
    layers = _topo_order(active_model.nodes,active_model.links)
    exogeneous = layers[0]
    
    for(i=1;i<layers.length;i++){
        layers[i].forEach(function(node){
            if(!node.intervened){
                sum = 0;
                node.parents.forEach(function(d){
                    b = get_edge_beta(d.id,node.id)
                    sum += b*std_values[d.name]
                })
                std_values[node.name] = sum;
                org_values[node.name] = sum*node.std+node.mean;
                if(!orange)
                    $("#"+node.id+"_mainknob").roundSlider({value:knob_values[node.name]})
                else
                    $("#"+node.id+"_changeknob").roundSlider({value:compare_knob_values[node.name]})

            }
            else{
                node.parents.forEach(function(d){
                    d3.select("#l"+d.id+"-"+node.id).transition().duration(1000).attr("opacity","0.2")
                    d3.select("#a"+d.id+"-"+node.id).transition().duration(1000).attr("opacity","0.2")
                })
                $("#"+node.id+"_icon").show()
            }
        })
    }
    return [std_values,org_values]
    // update_target(knob_values[target_name])
}

function update_main_node_values(){
    res = update_node_values(node_values,knob_values)
    node_values = res[0]
    knob_values = res[1]

}
function update_alternate_node_values(){
    
    res = update_node_values(compare_node_values,compare_knob_values,true)
    compare_node_values = res[0]
    compare_knob_values = res[1]

     
}

$("body").on("click",".remove_icon",function(){
    id =+ $(this).attr("id").split("_")[0]
    node = active_model.nodes.find(d => d.id==id)
    console.log(node)
    node.intervened = 0;
    node.parents.forEach(function(d){
        d3.select("#l"+d.id+"-"+node.id).transition().duration(1000).attr("opacity","0.8")
        d3.select("#a"+d.id+"-"+node.id).transition().duration(1000).attr("opacity","0.8")
    })
    $(this).hide()
    update_main_node_values()
    update_target(knob_values[target_name])
    if(isProbed){
        update_alternate_node_values()
        update_target(compare_knob_values[target_name],true)
    }

})


function copy_object(arr){
    var new_arr = {}
    Object.keys(arr).forEach(key => {
        new_arr[key] = arr[key]
    });
    return new_arr
}

function insert_state(){
    if(!prev_state){
        time += 1
        states.push({'time':time,'nodes':copy_object(node_values), 
            'compare_nodes': copy_object(compare_node_values), 'node_status':active_model.nodes,
            'target':prediction_val, 'compare_value':compare_val, 'node_size':5, 'node_size1':5})
        circle_size(time,true,true)
        line_chart("line_chart",states)
        console.log(states)
    }
    circle_size(time,true,true)
    line_chart("line_chart",states)
    feasibility_score()
}
function circle_size(time, main_state=false, change_state=false){
    states.forEach(function(d){
        // console.log(d,time)
        if(d.time != time){
            if(main_state)
                d.node_size = 3
            if(change_state)
                d.node_size1 = 3
        }
        else{
            if(main_state)
                d.node_size = 5
            if(change_state)
                d.node_size1 = 5
        }

    })
    
}
function revert_main_state(time){
    node_values = copy_object(states[time-1].nodes)
    active_model.nodes = copy_object(states[time-1].node_status)
    // console.log(active_model.nodes)
    // for(i=0;i<selected_attrs.length;i++){
    //     // console.log(selected_attrs[i])
    //     key = selected_attrs[i]
    //     node = active_model.nodes.filter(node => node.name == key)
    //     // console.log(key,node,node.mean)
    //     if(key != target_name){
    //         // $('input[name="'+key+'"]').val(node_values[key]*node[0].std+node[0].mean)
    //         $('div[name='+key+']').roundSlider('setValue',node_values[key]*node[0].std+node[0].mean);
    //     }
    // }
    prev_state = true
    prev_state = false
    circle_size(time,true,false)
    line_chart("line_chart",states)
    update_main_node_values()
    update_scatter_plot()
}

function revert_alternate_state(time){
    compare_node_values = copy_object(states[time-1].compare_nodes)
    for(i=0;i<selected_attrs.length;i++){
        // console.log(selected_attrs[i])
        key = selected_attrs[i]
        node = active_model.nodes.filter(node => node.name == key)
        // console.log(key,node,node.mean)
        if(key != target_name){
            // $('input[name="'+key+'"]').val(node_values[key]*node[0].std+node[0].mean)
            new_v = compare_node_values[key]*node[0].std+node[0].mean
            $('div[name='+key+'_change]').roundSlider({
                value:new_v,
                handleSize:5,
                readOnly:false,
            })

        }
    }
    prev_state = true
    prev_state = false
    circle_size(time,false,true)
    line_chart("line_chart",states)
    isProbed = true
    compare_val = regression(compare_node_values,change_probe=true)
    update_scatter_plot()
    $('#commit').show()
    $("#stop").show()
}

function update_neighbour_info(update_scatter=false,update_bars=true){
    num_of_points = $('#myRange').val()
    // console.log(compare_index)
    $.ajax({
        url: '/get_row',
        data: JSON.stringify({attrs:selected_attrs,index:selected_index, compare_index:compare_index, num_of_points:num_of_points}),
        type: 'POST',
        success: function(response){
            console.log("success !!!");
            console.log(response)
            if(update_scatter)
                scatterplot(Object.values(response.neighbours),Object.values(response.axis)) 
            if(update_bars){
                console.log(Object.values(response.features))
                isProbed = true
                play_probe(Object.values(response.features)[0])
            }
                // grouped_bar_chart(Object.values(response.features))

        },
        error: function(error){
            console.log("error !!!!");
        }
    });
}

function update_target(final_sum,change_probe=false, only_values=false){
    // final_sum = final_sum*target_std+target_mean;
    if(!only_values){
        if(isProbed){
            if(change_probe){
                compare_val = final_sum;
                update_target_bar(target_val,prediction_val, final_sum)    
            }
            else{
                prediction_val = final_sum
                update_target_bar(target_val,final_sum, compare_val)
            }
        }
        else{
            prediction_val = final_sum
            update_target_bar(target_val,final_sum, 0)
        }
    }
}

function update_latent_variables(){
    arr = $.grep(active_model.nodes, function( node, i ) {
      return ( (node.data_type == "Latent" ) && node.name != target_name);
    });
    console.log("latent edges: ",arr)
    var latent_dict = {}, latent_dict1 = {};
    arr.forEach(function(node){
        latent_dict[node.name] =  regression(node_values,node.name)*node.std+node.mean
        latent_dict1[node.name] =  regression(compare_node_values,node.name)*node.std+node.mean

    })
    console.log(latent_dict,latent_dict1)
    //latent variables
    var latents = d3.select(".nodegroup").selectAll('.latent_bars')
        .remove().exit()
        .data(active_model.nodes.filter(function(node){return (node.data_type == "Latent") && node.name != target_name}));
    
    var latent_scales = {};
    arr.forEach(function(node){
        var latent_scale = d3.scaleLinear()
                        .domain([node.min,node.max])
                        .range([0, 1]);

        latent_scales[node.name] = latent_scale;
    })

    latents
      .enter().append("rect")
        .attr("x", d => d.x)
        .attr("class","latent_bars")
        .attr("width", d => latent_scales[d.name](latent_dict[d.name]))
        .attr("y", d => d.y)
        .attr("height", 10)
        .attr("fill","rgb(102, 204, 102)");

    latents
      .enter().append("rect")
        .attr("class","latent_bars orange")
        .attr("x", d => d.x)
        .attr("display","none")
        .attr("width", d=> latent_scales[d.name](latent_dict1[d.name]))
        .attr("y", d => d.y+20)
        .attr("height", 10)
            .attr("fill","#F2711C");
    if(isProbed)
        $(".latent_bars.orange").show()
    else
        $(".latent_bars.orange").hide()   
}

function sumArray(a, b) {
  return a + b;
}

function sigmoid(v){
    return 1/(1+Math.pow(Math.E, -(v)))
}

function feasibility_score(){
    var row1= -1;
    // console.log(knob_values,node_values,compare_node_values,compare_knob_values)
    if(isProbed)
        row1 = copy_object(compare_node_values)
    $.ajax({
        url: '/feasibility',
        data: JSON.stringify({row:node_values,row1:row1,category:school_category}),
        type: 'POST',
        success: function(response){
            console.log("success !!!");
            console.log(response)
            if('val1' in response)
                feasibility_chart("#feasibility_bars", active_density, response.val,response.val1)
            else
                feasibility_chart("#feasibility_bars", active_density, response.val)
        },
        error: function(error){
            console.log("error !!!!");
        }
    });
}

/**
 * add rows to persona list
 */
function update_persona_list(ids,keys,vals){
    $('#persona_div').show();
    for(var i=0;i<ids.length;i++){
        $("#sample_list").append('<option value="'+ids[i]+'">'+keys[i]+'</option>')
    }
    // init
    $('#sample_list').dropdown({
     onChange: change_sample
    });
}

function get_edge_id(link,model){

    id = ""
    // console.log(link)
    source_id = link.source
    target_id = link.target
    source = model.nodes[source_id]
    target = model.nodes[target_id]
    // console.log(link.level)
    // console.log($('body option[value="'+link.level+'"]'))
    if((source.data_type == "Numeric" || source.data_type == "Latent") && (target.data_type == "Numeric" || target.data_type == "Latent"))
        id = '#l'+source.name+'-'+target.name
    else if(source.data_type == "Numeric" && target.data_type == "Categorical")
        id = '#l'+source.name+'-'+target.name+":"+$('option[value="'+link.tar_level+'"]').html() 
    else if(source.data_type == "Categorical" && target.data_type == "Numeric")
        id = '#l'+source.name+":"+$('option[value="'+link.level+'"]').html()+'-'+target.name

    return id
}

/**
 * find id of the feature
 */
function find_nodeId(node_name){
    nodes = active_model.nodes
    for(i=0;i<nodes.length;i++){
        node = nodes[i]
        if(node.name == node_name)
            return i
    }
}

function stardardize(instance){
    new_inst = {}
    for(node_name in instance){
        node_id = find_nodeId(node_name)
        node = active_model.nodes[node_id]
        new_inst[node_name] = (instance[node_name] - node.mean)/node.std 
    }
    return new_inst
}

$(document).on('keydown', function(event) {
   if (event.key == "Escape") {
       isClicked = false
       d3.select('.compared').attr('r','3.5').style('fill', saved_color).classed('compared',false)
       compare_index = -1
       update_neighbour_info()
       d3.select("#tooltip").classed("hidden", true); 
       // d3.selectAll('circle').trigger('mouseout')
   }
   if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault()
        $('body').on("mouseenter", '.label_text', function(){
            mouseIn($(this).attr('id').split('_')[0])})
        $('body').on("mouseleave", '.label_text', function(){
            mouseOut($(this).attr('id').split('_')[0]) })
   }
});


