from flask import Flask, render_template, url_for, request, jsonify, flash,redirect, session
# from flask_pymongo import PyMongo
import pandas as pd
from io import StringIO
# from utility import *
# from forms import RegistrationForm,LoginForm
import json
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.mixture import GaussianMixture

# import pycausal_jun as pc
from joblib import dump, load
# from semopy import Model
# from semopy import stats
# from factor_analyzer import FactorAnalyzer

global df;
df = None;


app = Flask(__name__)
# app.config["MONGO_URI"] = "mongodb://localhost:27017/causality"
app.config["SECRET_KEY"] = '80e2229aa326ca04ee982aa63b9b0f13'
# mongo = PyMongo(app)
# loc = "./static/csv/SAT_data_renamed.csv"
loc = "./static/csv/boston_housing.csv"
target = "MED_PRICE"
# loc = "./static/csv/diabetes1.csv"
# target = "hasDiabetes"

###default route, home page
@app.route("/")   
def home():
	return render_template("index.html",title = "Home")

@app.route("/save_dag",methods=['POST'])   
def save_dag():
	if request.method == 'POST':
		json_data = request.get_json(force=True);		
		pdag = json_data['pdag']

		with open('data.json', 'w') as fp:
			json.dump(pdag,fp)
			# fp.close()
		return jsonify(msg="success")

@app.route("/load_dag",methods=['POST'])   
def load_dag():
	if request.method == 'POST':
		with open('./static/models/admission_model2.json') as f:
			pdag = json.load(f)
			pdag = pc.PDAG.from_obj(pdag)
	return jsonify(msg="success", model= pdag.to_json())

###default route, home page
@app.route("/save_csv")   
def save_csv():
	data = pd.read_csv(loc)
	print(data.columns)
	dtypes = dict()
	for attr in data.columns:
		new_attr = attr.replace("%","").replace("-","_").replace(" ","_")
		dtypes[new_attr]='num'

	data.columns = [key for key in dtypes]
	data.to_csv('./static/csv/loan_data2.csv',index=False)
	return "hello"

#### read the csv data to a pandas dataframe
@app.route("/read_csv", methods=['POST']) 
def read_csv():
	if request.method == 'POST':
		global df
		csv_file = request.get_json(force=True);		
		df = pd.read_csv(StringIO(csv_file['content']))
		# scaler = StandardScaler()
		# X = scaler.fit_transform(df.values)
		# df = pd.DataFrame(X,columns=df.columns)
		# session['data'] = df.copy()
		return jsonify(msg="success",attributes=list(df.columns))

###create model
@app.route("/create_model")   
def create_model():
	return render_template("create_model.html",title = "Create Model")

@app.route("/save_model", methods=['POST'])
def save_model():
	json_data = request.get_json(force=True)     
	mod = json_data['model']
	with open('static/models/current_model.json', 'w') as fp:
		json.dump(mod, fp,indent=4)
	return jsonify(msg="success")

###default route, home page
@app.route("/explain_model")   
def explain_model():
	data = pd.read_csv(loc)
	print(data.columns)
	return render_template("explain_model.html",title = "Interpret Model", attrs= data.columns.tolist())

@app.route("/baseline")   
def baseline():
	data = pd.read_csv(loc)
	print(data.columns)
	return render_template("baseline.html",title = "Simple Prediction", attrs= data.columns.tolist())

###default route, home page
@app.route("/interaction")   
def interaction():
	data = pd.read_csv(loc)
	print(data.columns)
	return render_template("interaction.html",title = "Plug and Play", attrs= data.columns.tolist())

### correlation between two attributes
@app.route("/sem_fit",methods=['POST'])
def sem_fit():  
	global df
	json_data = request.get_json(force=True)     
	mod = json_data['model']
	target = json_data['target']
	scaler = StandardScaler()
	X = scaler.fit_transform(df)
	df_scaled = pd.DataFrame(X,columns = df.columns)
	# print(df_scaled.head())
	# mod = ''""" # measurement part
 #            acad_skill =~ cgpa + lor + sop +research
 #            test_skill =~ gre + toefl
 #            admit ~ acad_skill + test_skill
 #            # exogenous variances
 #      """''
	model = Model(mod,mimic_lavaan=True)
	model.fit(df_scaled)
	fit_indices = ['dof','chi2','rmsea','cfi','gfi','agfi','aic','bic']
	st = stats.gather_statistics(model)
	std = st._asdict()
	fit_measures = dict()
	for f in fit_indices:
		if(f in std):
			fit_measures[f] = std[f]
	# opt_mlw = Optimizer(model)
	# print(model.inspect()))
	attrs = model.names[3][0]
	features = [x for x in model.names[3][0] if x != target]

	mx_cov_df = pd.DataFrame(model.mx_cov, columns= attrs,index= attrs)
	from numpy.linalg import inv
	y_var = mx_cov_df[target]
	y_var = np.matrix(y_var.drop([target])).transpose()
	x_var = mx_cov_df.drop([target])
	x_var = np.matrix(x_var.drop([target],axis=1))
	
	# del model.names[3][0]
	# model.names[3][0].remove("admit")
	d = dict(zip(features, np.asarray(inv(x_var).dot(y_var)).reshape(-1)))
	pred = []
	m = df[target].mean()
	std = df[target].std()
	for ind,row in df_scaled.tail(100).iterrows():
		su = 0
		for k,v in row[features].iteritems():
		    # print(k,v)
		    su += v*d[k]
		pred.append(su*std+m)

	reg = LinearRegression().fit(df[features], df[target])
	reg_predict = reg.predict(df[features].tail(100))
	print(reg.coef_)
	print(d)

	return jsonify(msg="succcess",fit= model.inspect().to_dict("index"),measures= fit_measures, \
			 prediction=[df.tail(100)[target].tolist(),pred],coeffs=d)

@app.route("/causal_search",methods=['POST'])
def causal_search():
	# from pycausal.pycausal import pycausal as pc
	# pc = pc()
	# pc.start_vm() 
	# from pycausal import search as s
	# tetrad = s.tetradrunner()

	# global df
	# json_data = request.get_json(force=True)     
	# attrs= json_data['attrs']
	# algo= json_data['algo']
	# d = df[attrs]
	# # print(d.columns)
	# tetrad.run(algoId = algo, dfs = d)
	import pydot
	graph = pydot.Dot(graph_type='digraph',ranksep=2,nodesep=0.1)
	with open('./static/other/boston_structure.txt') as f:
		edges = []
		for edge in f:
			edges.append(edge)
			if "---" in edge:
				spl = edge.split("---")
				src = spl[0].strip()
				target = spl[1].strip()
				edge = pydot.Edge(src,target,dir="none")
			elif "-->" in edge:
				spl = edge.split("-->")
				src = spl[0].strip()
				target = spl[1].strip()
				edge = pydot.Edge(src,target,dir="forward")
			graph.add_edge(edge)

	# # print(graph.to_string())
	dot_str = graph.to_string()
	# dot_str = pc.tetradGraphToDot(tetrad.getTetradGraph())
	# print(tetrad.getTetradGraph())

	return jsonify(msg="success",edges=edges, dot_str = dot_str)

@app.route("/get_dot_string",methods=["POST"])
def get_dot_string():
	json_data = request.get_json(force=True)
	edges = json_data['edges']

	import pydot
	graph = pydot.Dot(graph_type='digraph',ranksep=2,nodesep=0.1)
	
	for edge in edges:
		if "---" in edge:
			spl = edge.split("---")
			src = spl[0].strip()
			target = spl[1].strip()
			edge = pydot.Edge(src,target,dir="none")
		elif "-->" in edge:
			spl = edge.split("-->")
			src = spl[0].strip()
			target = spl[1].strip()
			edge = pydot.Edge(src,target,dir="forward")
		graph.add_edge(edge)

	# print(graph.to_string())
	dot_str = graph.to_string()

	return jsonify(msg="success", dot_str = dot_str)


@app.route("/get_eigenvalues",methods=['POST'])
def get_eigenvalues():
	global df
	json_data = request.get_json(force=True)     
	attrs= json_data['attrs']
	d = df[attrs]
	# Create factor analysis object and perform factor analysis
	fa = FactorAnalyzer(rotation="varimax")
	fa.fit(d)
	# Check Eigenvalues
	ev, v = fa.get_eigenvalues()
	print(ev)
	return jsonify(msg="succcess",eigenvalues=ev.tolist())

@app.route("/get_efadetails",methods=['POST'])
def get_efadetails():
	global df
	json_data = request.get_json(force=True)     
	attrs= json_data['attrs']
	n_factors= json_data['n_factor']
	d = df[attrs]
	# Create factor analysis object and perform factor analysis
	fa = FactorAnalyzer(n_factors=n_factors,rotation="varimax")
	fa.fit(d)
	var = fa.get_factor_variance()
	var = [var[0].tolist(),var[1].tolist(),var[2].tolist()]
	# print(var)
	return jsonify(msg="succcess",loading=fa.loadings_.tolist(),variance=var, col=d.columns.tolist())


@app.route("/feasibility",methods=['POST'])
def feasibility():
	if request.method == 'POST':
		json_data = request.get_json(force=True);
		row = dict(json_data['row'])
		row1 = json_data['row1']
		category = int(json_data['category'])
		# print(row.values(),row.keys())
		df = pd.DataFrame([row.values()], columns= row.keys())
		
		model = load('./static/models/mixture_model_all.joblib') 
		
		probs = model.predict_proba(df)
		# print(probs)
		if(row1 != -1):
			row1 = dict(json_data['row1'])
			df1 = pd.DataFrame([row1.values()], columns= row1.keys())
			probs1 = model.predict_proba(df1)
			# print(probs1)
			# print(df.values,df1.values,model.means_)
			if( category == 4):
				return jsonify(val=np.max(probs),val1=np.max(probs1))
			else:
				return jsonify(val=probs[0][category],val1=probs1[0][category])
		if( category == 4):
			return jsonify(val=np.max(probs))
		else:
			return jsonify(val=probs[0][category])

@app.route("/see_model",methods=['POST'])   
def see_model():
	if request.method == 'POST':
		global df
		json_data = request.get_json(force=True);		
		attrs = json_data['attrs']
		target = json_data['target']
		model_type = json_data['model_type']
		data = pd.read_csv(loc)
		print("data length: ",len(data))
		# .sample(n=700)
		df_copy = data.copy()
		data= data[attrs]
		scaler = StandardScaler()
		# gmm = GaussianMixture(n_components = 3)
		# gmm.fit(scaler.fit_transform(data.drop(["research","admit"],axis=1)))
		# # print(gmm.means_)
		# dump(gmm, 'mixture_model.joblib') 

		# gmm = GaussianMixture(n_components = 4)
		# gmm.fit(scaler.fit_transform(data))
		# # print(gmm.means_)
		# dump(gmm, './static/models/mixture_model_all.joblib')

		if('pdag_load' in json_data):
			print("dukhse")
			with open('./static/models/housing_model1.json') as f:
				pdag = json.load(f)
				# pdag = json.dumps(pdag).to_json()

			mx = data.max()
			mn = data.min()
			mean = data.mean()
			std = data.std()
			for node in pdag['nodes']:
				# print(node)
				if(node['data_type'] != "Latent"):
					node['max'] = mx[node['name']]
					node['min'] = mn[node['name']]
					node['mean'] = mean[node['name']]
					node['std'] = std[node['name']]

		if(model_type == 'regression'): 
			sampled = df_copy[['Key',target]].sample(frac=1).head(100)
			indices = sampled.index.values.tolist()
			# print(sampled)
			return jsonify(msg="success",model= json.dumps(pdag), \
				indices= sampled.index.values.tolist(), \
				keys= sampled['Key'].tolist(), classes= sampled[target].tolist(), \
				rows = data.loc[indices].to_dict('index'))
		
@app.route("/get_row",methods=['POST'])
def get_row():
	if request.method == 'POST':
		json_data = request.get_json(force=True);		
		attrs = json_data['attrs']
		index = int(json_data['index'])
		compare_index = int(json_data['compare_index'])
		rng = int(json_data['num_of_points'])
		data = pd.read_csv(loc).dropna().reset_index()
		keys = data['Key']
		data = data[attrs]	
		row = data.loc[[index]].to_dict('record')
		val = data.loc[[index]][target].values[0]

		# dtypes = dict()
		# for attr in attrs:
		# 	dtypes[attr]='num'

		# data.columns = [key for key in dtypes]
		# # print(data.select_dtypes(['object']).head())
		# for column in data.select_dtypes(['object']): 
		# 	dtypes[column]='cat'

		# print(dtypes)
		# response = convert_dtypes(data,dtypes, 'mediate')
		rdf = data.copy()
		
		transformed_df, axisDf, neighbours, neighbour_values, components, scalex, scaley = compute_PCA(rdf,target,index,val,keys,rng)
		rows = []
		if(compare_index != -1):
			rows = transformed_df.loc[[compare_index]].to_dict('records')
			# rows = s[0]
			# for k in s:
			#     # values = [{"value": s[k][0], 'category': 'selected'}]
			#     r = {"attribute":k,'value':s[k][0]}
			#     rows.append(r)
		else:
			s = transformed_df.loc[[index]].to_dict('list')
			for k in s:
			    values = [{"value": s[k][0], 'category': 'selected'}, {"value": 0, "category": 'compare'}]
			    r = {"attribute":k,'values':values}
			    rows.append(r)

		return jsonify(msg="success",row= row, \
		neighbours=neighbours.to_dict('index'), neighbour_values= neighbour_values.tolist(), \
		features = rows, axis= axisDf.to_dict('index'), pca_elements= {'components':components.tolist(), \
		'scalex':scalex, 'scaley':scaley})

@app.route("/get_pca",methods=['POST'])
def get_pca():
	if request.method == 'POST':
		json_data = request.get_json(force=True);		
		attrs = json_data['attrs']
		val = json_data['val']
		rng = int(json_data['num_of_points'])
		data = pd.read_csv(loc).dropna().reset_index()
		keys = data['Key']
		data = data[attrs]	

		# response = convert_dtypes(data,dtypes, 'mediate')
		rdf = data.copy()
		
		transformed_df, axisDf, neighbours, neighbour_values,components, scalex, scaley = compute_PCA1(rdf,target,val,keys,rng)

		return jsonify(msg="success",\
		neighbours=neighbours.to_dict('index'), neighbour_values= neighbour_values.tolist(), \
		axis= axisDf.to_dict('index'), pca_elements= {'components':components.tolist(), \
		'scalex':scalex, 'scaley':scaley})

def compute_PCA1(data,target,val,keys,rng):
	print("range",rng)
	left_data = data[(data[target] > val-rng)]
	right_data = data[(data[target] <= val+rng)]
	rows_index = np.concatenate((left_data.sample(n=20).index,right_data.sample(n=20).index))
	# print(rows_index)
	y = data[target]
	X = data.drop([target],axis=1) 
	
	# rows_index = (abs(y - val)).sort_values()
	X = X.iloc[rows_index]
	y = y.iloc[rows_index]
	keys = keys.iloc[rows_index]
	indices = X.index
	columns = X.columns
	transformed_df = X

	scaler = StandardScaler()
	X = scaler.fit_transform(X)
	pca = PCA(n_components=2)
	X = pca.fit_transform(X)
	# print(np.transpose(pca.components_[0:2, :]))
	xs = X[:,0]
	ys = X[:,1]
	scalex = 1.0/(xs.max() - xs.min())
	scaley = 1.0/(ys.max() - ys.min())
	principalDf = pd.DataFrame(data = X, columns = ['PC1', 'PC2'])
	principalDf['PC1'] = principalDf['PC1']*scalex
	principalDf['PC2'] = principalDf['PC2']*scaley
	principalDf['value'] = y.values
	principalDf['Key'] = keys.values
	principalDf['index'] = indices
	principalDf['attributes'] = transformed_df.to_dict('records')
	axisDf = pd.DataFrame(data = np.transpose(pca.components_), columns = ['PC1', 'PC2'])
	axisDf['variable'] = columns
	
	return transformed_df, axisDf, principalDf, y, pca.components_[0:2, :], scalex, scaley

def compute_PCA(data,target,index,val,keys,rng):
	left_data = data[(data[target] > val-rng)]
	right_data = data[(data[target] <= val+rng)]
	rows_index = np.concatenate((left_data.sample(n=20).index,right_data.sample(n=20).index,np.array([index])))
	# print(rows_index)
	y = data[target]
	X = data.drop([target],axis=1) 
	
	# rows_index = (abs(y - val)).sort_values()
	X = X.iloc[rows_index]
	y = y.iloc[rows_index]
	keys = keys.iloc[rows_index]
	indices = X.index
	columns = X.columns
	transformed_df = X

	scaler = StandardScaler()
	X = scaler.fit_transform(X)
	pca = PCA(n_components=2)
	X = pca.fit_transform(X)
	# print(np.transpose(pca.components_[0:2, :]))
	xs = X[:,0]
	ys = X[:,1]
	scalex = 1.0/(xs.max() - xs.min())
	scaley = 1.0/(ys.max() - ys.min())
	principalDf = pd.DataFrame(data = X, columns = ['PC1', 'PC2'])
	principalDf['PC1'] = principalDf['PC1']*scalex
	principalDf['PC2'] = principalDf['PC2']*scaley
	principalDf['value'] = y.values
	principalDf['Key'] = keys.values
	principalDf['index'] = indices
	principalDf['attributes'] = transformed_df.to_dict('records')
	axisDf = pd.DataFrame(data = np.transpose(pca.components_), columns = ['PC1', 'PC2'])
	axisDf['variable'] = columns
	
	return transformed_df, axisDf, principalDf, y, pca.components_[0:2, :], scalex, scaley

def compute_Interaction(data,target,val,rng,keys):

	indices = data.index
	y = data[target]
	X = data.drop(target,axis=1) 

	columns = X.columns
	transformed_df = (X-X.min())/(X.max()-X.min())

	scaler = StandardScaler()
	X = scaler.fit_transform(X)
	poly = PolynomialFeatures()
	X_inter = poly.fit_transform(X)
	y_scaled = scaler.fit_transform(np.array(y).reshape(-1,1))

	regr = LinearRegression()
	model = regr.fit(X_inter, y_scaled)
	dimension = X[0].shape[0]
	coef_arr = interaction_matrix(model.coef_[0][dimension+1:], dimension)
	
	U, s, V = np.linalg.svd(coef_arr)
	X_trans = X.dot(U)
	# print(np.transpose(pca.components_[0:2, :]))
	# return jsonify(msg="success",X= X_trans[:,0:2].tolist(),axis = np.transpose(U[0:2, :]).tolist())
	X= X_trans[:,0:2]
	xs = X[:,0]
	ys = X[:,1]
	scalex = 1.0/(xs.max() - xs.min())
	scaley = 1.0/(ys.max() - ys.min())
	principalDf = pd.DataFrame(data = X, columns = ['PC1', 'PC2'])
	principalDf['PC1'] = principalDf['PC1']*scalex
	principalDf['PC2'] = principalDf['PC2']*scaley
	principalDf['value'] = y
	principalDf['Key'] = keys
	principalDf['index'] = indices
	axisDf = pd.DataFrame(data = np.transpose(U[0:2, :]), columns = ['PC1', 'PC2'])
	axisDf['variable'] = columns
	# print(list(data.columns.values))
	# print(axisDf.head())
	rows_index = (abs(y - val)).sort_values()
	neighbours = principalDf.iloc[rows_index.index[:rng]]
	neighbour_values = y.iloc[rows_index.index[:rng]]

	return transformed_df, axisDf, neighbours, neighbour_values

 #preprocess csv file, setup dtypes, binning or mediate
@app.route("/show_dag",methods=['POST'])
def show_dag():
	if request.method == 'POST':

		alpha = 0.01
		scaling = "normalize"
		selection = None

		json_data = request.get_json(force=True);	
		attrs = json_data['attrs']
		target = json_data['target']
		model_type = json_data['model_type']
		
		data = pd.read_csv(loc)
		data= data[attrs].sample(n=20000,random_state=10)
		data = data.dropna()
		dtypes = dict()
		for attr in attrs:
			dtypes[attr]='num'

		data.columns = [key for key in dtypes]
		# print(data.select_dtypes(['object']).head())
		for column in data.select_dtypes(['object']): 
			dtypes[column]='cat'

		response = convert_dtypes(data,dtypes, 'mediate')
		rdf = response[1]
		maps = response[2]

		if('pdag' in json_data):
			pdag = json_data['pdag']
			pdag = pc.PDAG.from_obj(pdag)

			
		### estimate the weights of the edges by regression
		pdag = parameterize(pdag=pdag,
		                    df=rdf,
		                    selection=selection,
		                    scaling=scaling,
		                    types=dtypes,
		                    cat_mapping = maps)
		print("######################")
		#print(pdag.to_json())
		return jsonify({'model': pdag.to_json()})


if __name__ == "__main__":
    app.run(port=5000, debug=True)