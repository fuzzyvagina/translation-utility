<?php
  $file = 'output/'.$_REQUEST['filename'].'-'.time().'.json';
  file_put_contents($file, json_encode($_REQUEST['json']));

  echo $file;
?>