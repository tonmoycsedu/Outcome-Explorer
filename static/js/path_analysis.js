
/**
 * main regression code
 */
function regression(node_values, target=target_name){
    sum = regression_effect(node_values,target)
    console.log(sum)
    final_sum = ((sum)*target_std+target_mean)
    
    return final_sum; 
    
}

function regression_effect(node_values,target=target_name){
    sum = 0
    parents = active_model.nodes.find(d => d.name == target).parents
    betas = beta_values[target]
    // console.log(parents,betas)
    parents.forEach(function(node){
        sum += node_values[node.name]*betas[node.name]  

    })
    return sum;
}
/**
 * dfs code to find path from source node to target variable
 */
function total_effect( src, dest, isVisited, path, model, corr) {
    isVisited[src] = true
    if(src == dest){
        // console.log("end")
        delete isVisited[src]; 
        return corr
    }
    var curr = model.nodes[src]
    var res = 0
    curr.children.forEach(c => {
        children = model.nodes[c.id]
        b = get_edge_beta(src,c.id)
        res += total_effect(c.id,dest,isVisited,path,model,corr*b)  
    });
    return res     
}

function get_edge_beta(src,dest){
    for(k=0;k<active_model.links.length;k++){
        link = active_model.links[k]
        if(link.direct_type == 'Directed'){
            if(link.source.id == src && link.target.id == dest){
                return link.beta
            }
            
        }   
    }
}