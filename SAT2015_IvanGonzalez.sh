finish="Presiona una tecla para continuar..."
cont=0
if [ ! -e .steelCode ]
then
 if [ ! -d .git ]
 then
  git init
 fi

 url='https://github.com/steelCodeMobiik/'
 repName='SAT2015_IvanGonzalez'
 ext='.git'
 fullUrl=$url$repName$ext
 echo -e "\n\nProyecto nuevo"
 
 git remote add steelCode $fullUrl
 git remote update
 cont=$?

 if [ $cont -eq 0 ]
 then
  echo "steelCode is watching your code..." > .steelCode
  echo -e "\n\nRepositorio agregado"
 fi
fi

if [ $cont -eq 0 ]
then
 git add .
 git commit -m "pushed by steel Code"
 git push steelCode master
 cont=$?

 if [ $cont -eq 0 ]
 then
  echo -e "\n\nSe subio el codigo"
 fi
fi

echo -e "\n\n"
read -n1 -r -p "$finish" key
