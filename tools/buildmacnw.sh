echo 'Iniciando la creacion del paquete'
cd ..
rm ../FormsEngineFisicas.nw
zip -r ../${PWD##*/}.nw *
open ../FormsEngineFisicas.nw
cd tools
echo 'Paquete finalizado'
