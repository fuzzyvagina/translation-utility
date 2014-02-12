<?php

$fileName = $_FILES['uploadfile']['name'];
$fileType = $_FILES['uploadfile']['type'];
$fileContent = file_get_contents($_FILES['uploadfile']['tmp_name']);
$dataUrl = json_decode($fileContent);

$json = json_encode(array(
  'name' => $fileName,
  'dataObj' => $dataUrl
));

echo $json;

?>