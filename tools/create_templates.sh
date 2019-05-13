#!/bin/sh
urlencode() {
    local data
    data="$(curl -s -o /dev/null -w %{url_effective} --get --data-urlencode "$1" "")"
    if [[ $? != 3 ]]; then
        echo "Unexpected error" 1>&2
        return 2
    fi
    echo "${data##/?}"
    return 0
}

dataParams=$(urlencode '{"ejercicio":2014,"sincalculo":false,"tipodocumento":1,"subregimen":"9,605"}')
echo "Realizando peticion"

curl -x http://10.69.41.203:8080 -L https://4a9f13f84187421383f9dfa78c595a11.cloudapp.net/Declaracion/ObtenerPlantillaCompleta?data=$dataParams -k -o plantilla.txt

echo "Reconstruyendo XML"
node reconstrucXml.js