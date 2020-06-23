(async () => {
  const people = await postToApi({ command: 'getPeople' });
  const cells = await postToApi({ command: 'getCells' });
  const roles = await postToApi({ command: 'getRoles' });
  const MAX_CELLS_PER_ROW = 10;
  const HEXAGON_WIDTH = getComputedStyle(document.documentElement).getPropertyValue('--hexagon-width').match(/\d+/)[0];
  let orderedCells = {};
  cells.forEach(cell => {
    orderedCells[cell.importance] = orderedCells[cell.importance] || [];
    orderedCells[cell.importance].push(cell);
  });
  Object.entries(orderedCells).forEach(([importance, arr]) => {
    const splits = Math.ceil(arr.length / MAX_CELLS_PER_ROW);
    const sliceLength = Math.ceil(arr.length / splits);
    let arr2d = [];
    for (let i = 0; i < splits; i++) {
      arr2d.push(arr.slice(i * sliceLength, (i+1) * sliceLength));
    }
    orderedCells[importance] = arr2d;
  });

  document.querySelector('#people').insertAdjacentHTML('afterbegin', /*html*/`
    ${people.map(person => `<li id="p${person.id}">${person.firstname} ${person.nickname ? `'${person.nickname}'` : ''} ${person.lastname}, ${person.initials}</li>`).join('')}
  `);
  document.querySelector('#people').addEventListener('click', peopleClick);
  document.querySelector('#hive').insertAdjacentHTML('beforeEnd', /*html*/`
    ${Object.entries(orderedCells).map(([importance, arr2d]) => `${arr2d.map(row => `<div class="row ${[...new Set(row.map(cell => cell.type))].join(' ')}">
      ${row.map(cell => {
        const w = HEXAGON_WIDTH, h = HEXAGON_WIDTH * 1.1547005;
        return /*html*/`
      <svg id="c${cell.id}" class="hex" width=${w} height=${h}>
        <polygon points="${w/2},0 ${w},${h/4} ${w},${h*3/4} ${w/2},${h} 0,${h*3/4} 0,${h/4}" />
        <text x="${w/2}" y="${h/2}" text-anchor="middle">${cell.name}</text>
      </svg>
    `}).join('')}
    </div>`).join('')}
  `).join('')}`
  );
  document.querySelector('.row.client-minor').classList.add('spacer');
  document.querySelector('#hive').addEventListener('click', cellClick);

  function peopleClick(e) {
    if (e.target.tagName !== 'LI') return;
    const id = Number(e.target.id.substr(1));
    document.querySelectorAll('#people li').forEach(li => li.classList.remove('selected', ...roles.map(role => role.role)));
    e.target.classList.add('selected');
    cells.forEach(cell => {
      const el = document.querySelector(`#c${cell.id}`);
      el.classList.remove('selected', ...roles.map(role => role.role));

      const cellRelated = cell.people.find(person => person.id === id);
      if (cellRelated) {
         el.classList.remove('hidden');
         el.classList.add(cellRelated.role)
      }
      else el.classList.add('hidden');
    });
  }

  function cellClick(e) {
    if (e.target.tagName !== 'polygon') return;

    document.querySelectorAll('.hex').forEach(hex => hex.classList.remove('hidden', ...roles.map(role => role.role)));
    e.target.parentElement.classList.toggle('selected');
    const selected = [...document.querySelectorAll('.hex.selected')].map(cellEl => cells.find(cell => cell.id === Number(cellEl.id.substr(1))));
    const selectedPeople = Object.values(selected.flatMap(cell => cell.people).reduce((peopleObj, person) => {
      peopleObj[person.id] = peopleObj[person.id]?.role_importance > person.role_importance ? peopleObj[person.id] : person;
      return peopleObj;
    }, {})).filter(selectedPerson => selected.every(cell => cell.people.find(person => person.id === selectedPerson.id)));

    document.querySelectorAll('#people li').forEach(li => {
      li.classList.remove('selected', ...roles.map(role => role.role));
      const person = selectedPeople.find(person => person.id === Number(li.id.substr(1)));
      if (person) li.classList.add(person.role);
    });
  }
})()

async function postToApi(body) {
  const response = await fetch('http://beehive.ecapacity.dk/data.php', {
    method: 'POST',
    headers: {'Content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  return await response.json();
}