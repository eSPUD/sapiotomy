# Scotts Notes on Slides 1-8



## Slide 1

### Initial Issues
The first issue with this one is that it needs to show the steps taken.  Maybe how a human completes the task, then compare it with a reasoning model.  

It also shows the accuracy toward the answer, not why the accuracy differs.  
2+2 = ? is 99% likely to gbe right, but 17 * 24 = ? is only 15% likely to be right, based on fast thinking.  Where are these numbers coming from?  Additionally, math may not be a good test for this.  LLMs have always used python and other tools to calculate.  It will just do print(17 * 24) and print (2+2).

So we need some type of disclaimer - nowadays, for arithmetic frontier model will use a tool to save on tokens, like python, and code a simple print(2 + 2) or print(17*24).  

Additionally, 17 * 24, on a fast-based model with no reasoning will be right every time - 408.  Even 350 * 638, will be right.  Once you get into the 1000s level numbers however, it is incorrect.  

tested on deepseekv3 : 
4502 * 6398 - wrong by 10,000.  Answer provided without reasoning : 28793796, correct answer : 28,803,796.

### How it could be improved
Definitely a question somewhere;  
Think about it: 
How would you solve each problem? When you think 2 + 2, do you have to count with your hands, or does 4 just pop into your head?  When you see a number like 17 * 24, how do you reason through it?  
* We can extract some of the good things from my slide 1 such as this and implement it into the draft apps slide 1.  

We could add 4 levels instead of 2?  
2+2
17 * 24
350 * 638
4502 * 6398

And show as the steps increase, instant answering falters.  That gies unti the next slide, the instant answer problem, pretty cleanly.  


- A slide show type of thing.  Open the first slide, 2 + 2 pops up with the first sentence "Your mind has tow gears.  The first, Fast thinking, which answers 2 + 2 instantly.  Then, the user continues, maybe a scroll or something.  17 * 24 pops up "Slow thinking is what you switch into for "17 * 24".  Then below that, "How would you work out this problem?" interactive exercise.  At the bottom, there could be the 4 levels.  This sets up for the instant answer problem. 
    -  However, the thing is I believe the reader may want to look at the reasoning prior to the instant answer slide.  

- Lets se a difficulty dial?  replace the 15% bar with a drag dial, with the 4 levels.  2+2 -> 17 * 24 -> 350*638->4502*6398.  Two columns update live as one drags.  A "blurt it" vs "show your work" with the percentages.  At the bottom, the lines both glow green, as the 2+2 already does.  As you climb the blurt column flips red.  

## Slide 2
The sentence “Natalia sold clips to 48 friends in April, then half as many in May. How many clips did she sell altogether?” is going to be anihilated by any LLM in our range.  PaLM-540B(the language model that citatian stub refers to) was advertised by Google in 2022.  Nevertheless, we could still keep it, maybe just a disclaimer that this is from models before inference time-scaling was thoroughly studied.  

This slide is pretty bare. 

## Slide 3
Show you work can be improved with a better example.  Additionally, the accuracy is based on this PaLM-540B model from 2022.  



