#!/bin/bash
PATH=$PATH:/home/pi/bin
export AZURE_STORAGE_ACCOUNT='yourStorageName'
export AZURE_STORAGE_ACCESS_KEY='yourStorageKey'
 
container_name='lunchbell-images'
 
#today=`date '+%Y-%m-%d-%H-%M-%S'`;
#filename="$today.jpg"

filename=$1
 
echo "taking the picture..."
wget http://127.0.0.1:8080/?action=snapshot -O /home/pi/$filename
 
#echo "croping the picture ..."
#mogrify -crop 1487x619+907+904 $filename
 
echo "logging into azure..."
/home/pi/bin/az login -u "yourAdminUser" -p "yourAdminPwd"
 
echo "uploading image"
/home/pi/bin/az storage blob upload --container-name $container_name --file /home/pi/$filename --name $filename
 
echo "deleting the image"
rm /home/pi/$filename
 
echo "logging out from azure"
#/home/pi/bin/az logout


echo ""