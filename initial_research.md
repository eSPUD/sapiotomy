Research 7/7/26

Topics:


    Inference Time-scaling
    Mixture of Experts
    Agentic Systems
    Mamba-based Architecture


Put together a proposal for Inference TSS, and MOE.  Identify three other topics and create proposals for them.  



## Inference Time-Scaling

### What it is

    Allocating extra computational resources while a model is generating a response.  Dedicating compute to reasoning, enabling the model to think longer.  
    Broken down into three categories: 
        Parallel Scaling; Consensus through self-consistency
            Sample many candidates, then select best-of-N, self consistency, or verifier-ranked selection.  
        Sequential Scaling; Refining reasoning through iterative improvements
            Start with one candidate and improve it over time. Plain chain-of-thought/think longer.  
        Internal Scaling: Letting the model dynamically adjust generation depth based on difficulty.  
            The model itself learns via outcome-based RL to produce long chains, deciding how long to think.
    Tldr: Inference time-scaling shifts the focus from scaling train-time compute to scaling test-time compute.  

### Prior Tools

    **Debugging/Research:** LLM Reasoners has a modular library with a reasoning tree visualizer.  TreeQuest implements adaptive branching MCTS with visualization.  ReasonGraph has visualization for reasoning paths.  ThinkBooster is a web-based visual debugger for inspecting test-time scaling strategies, sampled trajectories, and scoring signals.  


    **Auditing/Interpretability:** ReasoningLens does hierarchal visualization plus diagnostic auditing of large reasoning models.  You chat with a model like Qwen 32B, it produces its reasoning similar to asking questions to Claude or GPT(you can click the “thinking” box and it will spit out exactly what the model is reasoning), and then has an analysis button to have GPT or Claude convert the entire reasoning portion into a interactive hierarchal map/diagram flow, with suggestions on where the reasoning might have went wrong and how it works.  


    **Hippo:** Hippo is a visualization tool focused on chain-of-thought visualization as an editable hierarchy of topics, enabling user to review and modify models thought process before final output is generated.  
    **A Visual Guide to Reasoning LLMs:** A static illustrated post, positioned as a pedagogical explainer for test-time compute visualization.  
        This is a blog, showing what test time compute is with comparison to train-time compute, and how a models performance scales as you increase compute power during test-time(inference time-scaling). 





Throughout this chat, we will be identifying method in which each topic, or a new topic, could be better visualized or modeled for explainability, audibility, etc..... 



Prompt:
# Research on Modeling & Visualization for IEEE VIS 2026


## Role


You are taking on the role of my research assistant. You are well-versed in the field of AI, with vast knowledge on topics such as :

    Inference time-scaling
    Mixture of Experts models
    Agentic Systems
    Mamba-based Architectures



## Context

We are conducting research on ideas for the IEEE VIS 9th workshop on AI Visualization and Explainability. See link : https://visxai.io. 


Our goal is to look through a couple of topics, such as Inference Time-scaling, and Mixture of Experts models. We will look at gaps/areas of growth for these two topics In terms of visualization and explainability. In addition, we will look for new topics. By the end of this session, we will have created 5 separate suggestions for 5 unique topics. 


A good example of a visual tool is the Transfomers Explained tool, linked here: https://poloclub.github.io/transformer-explainer/


## Task

The task is very dynamic for this session. We will first start out by researching Inference Time-Scaling and MOE models. We want to see what they are, how they work, why they are important, what solutions they bring to the table, and more. Then we will move into identifying ways in which we could create a tool that allows others to see how one of these concepts work through visualization and explanation. After that, we will identify other topics, potentially Agentic Systems, Mamba-based Architectures/Mamba-Transfomer hybrids, and similar. We will then come up with some unique proposals/suggestions per topic for visualization tools. 


## Ready to Launch

When you are familiar with the task and ready to go, we can get started. 