call npm run build
cd .\dist\
git init
git checkout -b gh-pages
git add -A
git commit -m "%DATE%%TIME%"
git push -f git@github.com:ybr54323/drawing-board.git gh-pages