echo "Building js files"
npm run build

echo "copying to gh-pages branch"
rm -rf deploy
mkdir deploy
cp -R build deploy
cp index.html deploy
git co gh-pages
rm -rf build
mv deploy/build .
rm index.html
mv deploy/index.html .
git ci -am "new version"

echo "pushing to github"
git push -f
rm -rf deploy
git co master

echo "all done"
