## Why are we using submodules
Why did we choose submodules to setup realstudio? The main reason is that we need to have all depending projects inside the main **realstudio** project. Because of that we need to find a way to get the project realstudio depends on into the correct location. There are several ways to do that:
 1. Use symbolic links 
 2. Just copy them to the desired location or checkout the repository at that location
 3. Use git subtree
 4. Use git submodule

Option **1** works great on Unix systems but not on Windows which is why it is difficult to recommend that for all developers.

Option **2** is a bit clumsy as one would need to checkout all repositories to a certain location and then manually copy them into the realstudio project. With each update of litescene, etc that needs to be done again and if one decides to make changes inside the copy he needs to copy them back into the repository clone which is also very error prone.
If you checkout the liteXXX, etc. projects into realstudio they might be pushed back into the realstudio repository which leads to duplicates and two sources of truth. You definitely dont want that. 

Option **3** can work and is very similar to copying the sources into realstudio with the difference that git takes care the files and allows for updates from upstream. It gets very tricky, however, if you make changes to a subtree project inside realstudio repo and want to push them back. This is what we do very often but it would lead to a difficult workflow of creating a personal fork for one of the subtree projects to push to that and then open a MR from there.

Option **4** is the option I would recommend for us to use. People argument against it because the submodules are a bit difficult to keep in sync with the original repo (but so is it for all the other options as well) and the submodules are always in a *detached HEAD* state which is difficult to understand for people new to git.
The good thing is that these obstacles are easy to overcome using a little script inside the realstudio repo.

## What is a submodule
A submodule holds a reference to another repo and to a certain commit of that repository. A submodule will stay at that certain commit till you tell it to update to another commit. That is actually quite good because it allows to ensure that everyone works with the same version of the submodule. You just need to think about that you need to update the submodule if a newer version is desired.

## How to use a submodule
A submodule is created with ```git submodule add <git repo url>```. That creates the directory for the submodule and a ```.gitmodules``` file. The ```.gitmodules``` file holds the repo name and url.
Someone that freshly clones the repo needs to init and updates the submodule to get the code cloned locally.

    git submodule update --init

The submodule then works like an independent repository inside the parent. Meaning that all changes made to a submodule need to be commited and pushed fron a location inside that submodule. From the parent repo you then need to commit and push the updated reference to the submodule. 

That sounds more complicated then it actually is. You just push changes where you make them as you would with an independent repository as well. And to update the reference to the submodule you need to push the new reference from the parent repo.

## The convenient way
The script ```01_update-submodules.sh``` does the most of the work for you. You only need to make your code chandes and push either in the parent or submodule. 

The update of the submodule and the reference is taken care of by the script. 

You can push the updated submodule reference from the parent repo but you don't have to.

The **detached Head** state is also taken care of by the script. It will simply checkout master branch for you. That ensures that you wont loose your changes when running the script without pushing.