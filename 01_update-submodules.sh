set -e
set -x
git submodule update --init

# update all submodules to the latest version on master
git submodule foreach git pull origin master

# because we do not like to work in detached head state I also checkout the master branch for each submodule
git submodule foreach git checkout master

# just in case we had master-branch checked out already we rebase it to orign/master to have the latest version
git submodule foreach git rebase origin master