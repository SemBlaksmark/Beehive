<?php
  header("Access-Control-Allow-Origin: *");
  header('Access-Control-Allow-Headers: Content-Type');

  require_once('db.php');
  $getCells = $conn->prepare('SELECT cells.id, name, type, importance FROM cells JOIN cell_types ON cell_types_id = cell_types.id ORDER BY importance, type DESC, name');
  $getPeople = $conn->prepare('SELECT * FROM people ORDER BY lastname');
  $getRoles = $conn->prepare('SELECT * FROM roles');
  $getAssociated = $conn->prepare('SELECT people_id AS id, firstname, lastname, nickname, initials, role, importance AS role_importance FROM (SELECT * FROM cell_assignments WHERE cells_id = ?) AS cell JOIN people on cell.people_id = people.id JOIN roles on cell.roles_id = roles.id ORDER BY importance, lastname');

  $post = json_decode(file_get_contents('php://input'), true);
  $result;
  switch($post['command']) {
    case 'getCells':
      $getCells->execute();
      $cells = $getCells->get_result()->fetch_all(MYSQLI_ASSOC);
      foreach($cells as &$cell) {
        $cell['people'] = getAssociated($cell['id']);
      }
      $result = $cells;
      break;
    case 'getPeople':
      $getPeople->execute();
      $result = $getPeople->get_result()->fetch_all(MYSQLI_ASSOC);
      break;
    case 'getRoles':
      $getRoles->execute();
      $result = $getRoles->get_result()->fetch_all(MYSQLI_ASSOC);
      break;
    case 'getAssociated':
      $result = getAssociated($post['cellId']);
  }
  echo json_encode($result, JSON_UNESCAPED_UNICODE);
  $conn->close();

  function getAssociated($cellId) {
    global $getAssociated;
    $getAssociated->bind_param('i', $cellId);
    $getAssociated->execute();
    return $getAssociated->get_result()->fetch_all(MYSQLI_ASSOC);
  } 
?>