+++
title="Ml patterns design"
date=2023-03-04
weight = 10

[taxonomies]
categories = ["MLarchitecture"]
tags = ["Mldesign"]
+++

# **Machine Learning Patterns**

Hello! First and foremost, I am embarking on a journey to highlight the main aspects presented in the book "[Machine Learning Design Patterns](https://www.oreilly.com/library/view/machine-learning-design/9781098115777/)" This series is intended for machine learning engineers, data engineers, and data scientists. I will skip the explanation of basic terminology and focus on the nuances of facing the most common challenges when deploying machine learning models. The concept of patterns was introduced in the field of civil engineering/architecture by Christopher Alexander and five co-authors in the book titled "A Pattern Language" (1977). The main idea is that in a situation that happens recurrently, the pattern describes the core solution for this context and can be applied several times for this or similar ones. Here, we will explore the most general patterns that can be applied to machine learning system design.

<!-- more -->

---

However we can't proceed without defining the most common challenges in ML:

## **Data Quality**

As you may know, in ML, "Garbage in, garbage out" applies, we must to check accuracy, completeness, consistency and timeliness of data

* **Data accuracy** refers to the great and harness job that data engineers carry out. These engineers play an essential role in checking and handling typos, duplicate entries, measurement inconsistencies, missing features, and the particularities of unstructured data. For instance, duplicates can lead the model to assign more weight to those duplicated samples during learning. Also, incorrectly labeled training examples introduce bias in the model.
* **Data Completeness** ensures that your training data contains a varied representation of each label. It has the same effect on learning as the duplicated examples in the training data. To deal with data accuracy and completeness issues, you should perform an Exploratory Data Analysis (EDA). I encourage you to take a look at Pandas profile or Dtale to facilitate this analysis.
* **Data consistency** is another common aspect of machine learning. As you know, in supervised learning, you need labeled data, so here, we should ask for labeled data or start labeling it. The problem arises when labelers introduce bias, especially if the data requires domain knowledge (like in medical images). One common technique is to divide the work among a group of people, then have multiple people labeling each example and take the most commonly applied label (we will see this in-depth in Fairness Lens pattern design). Inconsistent features are also considered in this section as they can change over time (think about sensors with different offset of calibration).
* **Timelines** in data refers to the latency between the event occurrence and the addition to the database. It is more important in real-time machine learning applications, so in this case, you should record as much data as possible. For example, add a timestamp when a data point was generated and when it was added to the storage.

## **Reproducibility**

Machine learning, unlike traditional software, has an inherent element of randomness. For example, matrix weights are initialized with random values, so the model converges to different outputs for different training executions. This can make it difficult to run comparisons across experiments. Fixing a value for seed can solve this issue.

Training an ML model involves several artifacts that need to be fixed to ensure reproducibility: the data used, the splitting mechanism used to generate datasets for training and validation, data preparation and model hyperparameters, and variables like batch size and learning rate schedule. It also applies to ML framework dependencies. Running ML workloads in containers and standardizing library versions can help ensure repeatability.

## **Data Drift**

Data drift is an important concept in ML, especially in production. Data drift refers to the challenge of ensuring that your machine learning models remain relevant. To solve for drift, it’s essential to continually update your training dataset, retrain your model, and modify the weight your model assigns to particular groups of input data. Exploratory data analysis is a technique required here to understand the behavior of the data. For example, predicting the likelihood of a storm requires exploring the data available from the sensors for this scenario. In the next image, we can see that training a model on data before 2000 would lead to inaccurate predictions.

![chap1_datadrift.png](chap1_datadrift.png)

> Copyright 2020 Google Inc. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0) Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

## **Scale**

You will encounter scaling challenges in different phases of your ML application, such as data collection and preprocessing, training, and serving. The size of your data willl dictate the tooling required for your solution. ML engineers are responsible for determining the neccesary infrastructure for a specific training job. If your dataset is big enough, model training can be time consuming and computationally expensive.  In the context of model serving, the infrastructure required to support a team of data scientist getting predictions is entirely different from the infrastructure necessary to support a production model for millions of predictions by hour. We will see resilience and reproducibility in chapter 6 and 7.

## **Multiple Objectives** (The hidden big challenge)

Model in production introduce a big challenge for a Ml engineer because the model is being used by different teams/roles in the organization. Having this scenario, we will see that defining a sucessful model is not easy. Each user/team/role has his own definition of a success model given his needs.  For example, a data scientist/ML research is interest in minimize the loss function of the model. The project manager is interested in generate value by linking this model into the organization products, so here we start dealing with how to define a KPI that mimics the behavior of the loss function. Finally, the executive team is insterested in increase the revenue by using this model but they understand the KPI more that a mathematical function like loss function.  As you saw, it is responsability of the data scientist work together with the project manager to define this KPI, then move this into executive team.

## Thanks

Dear [James Clark](https://www.linkedin.com/in/jameshclrk/), I just wanted to take a moment to thank you for inspiring/helping me to start my own personal blog. Your blog, https://jamesclark.dev/, has been a source of inspiration for me, and your willingness to share your experiences and knowledge has been invaluable. Thanks to your guidance, I now have a platform to express my thoughts, share my ideas, and connect with others who share my passions. Your support and encouragement have been instrumental in helping me get started, and I am truly grateful for all that you have done for me. Thank you again for everything, James!
