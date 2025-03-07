# Outcome-Explorer
This is the accompanying code repository for the following paper: 

Naimul Hoque, Klaus Mueller. Outcome-Explorer: A Causality Guided
Interactive Visual Interface for Interpretable Algorithmic Decision Making.
IEEE Transaction on Visualization and Computer Graphics (TVCG), 2021.
https://doi.org/10.1109/TVCG.2021.310205

See a demo video to get a sense of the tool: https://www.youtube.com/watch?v=ot4h2cXFhe8

## Installation
The tools uses Vanilla JS and a flask python server. Run the following command to install it:

``` pip install -r requirements.txt ```

``` python app.py ```

## Overview
The tool has two interfaces/Modules: 1) Creation Module and 2) Interpretation Module.
The creation module is designed for expert users with knowledge of causal modeling whereas anyone can use the interpretation module. 
<p align="center">
<img width="493" alt="user_flow1" src="https://github.com/user-attachments/assets/051eefd9-01ee-4ee7-b435-e47128f94d5d" />
</p>

## Try it out on Boston Housing Dataset
As a starting point, try building a model using Boston Housing Dataset: https://www.geeksforgeeks.org/boston-dataset-in-sklearn/

### Create Model
To create a model, follow the steps below.

1) go to ```http://127.0.0.1:5000/create_model#```

2) Click on the **Get Started** button

3) You should see the following modal.
<p align="center">
<img width="447" alt="Screenshot 2025-03-06 at 8 22 28 PM" src="https://github.com/user-attachments/assets/b06dec32-372c-4abb-8c1f-743eff8950dc" />
</p>

5) You need to provde three inputs.
   
   4.1) The dataset. Go to the ```static/data``` and select ```boston_housing.csv```
   
   4.2) You will see a list of feature names after uploading the dataset. Click on the last feature ```MED_PRICE```. This tells the system that ```MED_PRICE``` is the target variable that you want to predict.

   4.3) Upload the causal structure. This should be a txt file. Go to ```static/data``` and select ```boston_structure.txt```
   The file uses <a href="https://graphviz.org/doc/info/lang.html">DOT Language</a> from Graphviz to define the causal structure.
   The structure was obtained by running the dataset into the <a href="https://semopy.com">Semopy</a> package. We used the PC algorithm for this.

   4.4) Click on the **Run Model** button.

6) You will see the causal structure in the middle. You will see the fitted model details on the right.
The bottom right corner shows the performance of the predictive model.
<p align="center">
<img width="1718" alt="Screenshot 2025-03-06 at 8 32 53 PM" src="https://github.com/user-attachments/assets/40202aac-b4d3-4226-99f8-1a6db95dadaf" />
</p>

7) Save the model: click on the **Save Model** button and provide a filename. No need to provide any extension. For example, put in **boston** as the filename.

### Interpret Model

1) Go to ```http://127.0.0.1:5000/explain_model/<csv_file>/<target_variable>/<model_file>```

It takes three parameters: 1) the csv dataset name; 2) the target variable; and 3) the model filename. 
For instance, you can put in the following url if you followed previous steps:

```http://127.0.0.1:5000/explain_model/boston_housing/MED_PRICE/boston```

2) You will see the following interface. It's the same model as previously see but visualized in a more intuitive way.
   You can move the variables by dragging their names on the interface. You can do a lot of stuff in this interface.

   See the demo video to learn more! https://www.youtube.com/watch?v=ot4h2cXFhe8
   
<img width="1724" alt="Screenshot 2025-03-06 at 8 44 25 PM" src="https://github.com/user-attachments/assets/08838780-9dea-422e-9ace-6db9610667b7" />



