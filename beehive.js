(async () => {
  let data = [
    postToApi({ command: 'getPeople' }),
    postToApi({ command: 'getCells' }),
    postToApi({ command: 'getRoles' }),
  ];
  const [people, cells, roles] = await Promise.all((await Promise.all(data)).map(response => response.json()));
  const resizeObs = new ResizeObserver(entries => {
    const classMap = Object.fromEntries([...document.querySelectorAll('.hex')].map(cell => [cell.id.substr(1), [...cell.classList]]));
    document.querySelector('#hive').innerHTML = '';
    drawCells(entries[entries.length - 1].contentRect.width, classMap);
  });
  resizeObs.observe(document.querySelector('#hive'));

  document.querySelector('#people ul').insertAdjacentHTML('afterbegin', `
    ${people.map(person => `<li id="p${person.id}">${person.firstname} ${person.nickname ? `'${person.nickname}'` : ''} ${person.lastname}, ${person.initials}</li>`).join('')}
  `);
  document.querySelector('#people').addEventListener('click', peopleClick);
  document.querySelector('#hive').addEventListener('click', cellClick);

  function drawCells(width, classMap) {
    const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const hexagonWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hexagon-width')) * remSize;
    const cellsPerRow = Math.max(1, Math.floor((width - .5 * hexagonWidth) / (1 + hexagonWidth)));
    let orderedCells = [];
    cells.forEach(cell => {
      orderedCells[cell.importance] = orderedCells[cell.importance] || [];
      orderedCells[cell.importance].push(cell);
    });
    orderedCells.filter(row => row);
    let cellsLayout = [];
    orderedCells.forEach(row => {
      const splits = Math.ceil(row.length / cellsPerRow);
      const sliceLength = Math.ceil(row.length / splits);
      for (let i = 0; i < splits; i++) {
        cellsLayout.push(row.slice(i * sliceLength, (i + 1) * sliceLength));
      }
    });
    document.querySelector('#hive').insertAdjacentHTML('beforeEnd', cellsLayout.map(row => `<div class="row ${[...new Set(row.map(cell => cell.type))].join(' ')}">
      ${row.map(cell => {
      const w = hexagonWidth, h = hexagonWidth * 1.1547005;
      const words = cell.name.split(/\s/g);
      return `<svg id="c${cell.id}" class="${classMap[cell.id] ? classMap[cell.id].join(' ') : 'hex'}" width=${w} height=${h}>
        <polygon points="${w / 2},0 ${w},${h / 4} ${w},${h * 3 / 4} ${w / 2},${h} 0,${h * 3 / 4} 0,${h / 4}" />
          <text x="${w / 2}" y="${h / 2 - words.length * remSize / 2}" text-anchor="middle">
            ${words.map(word => `<tspan x=${w / 2} dy="${remSize}">${word}</tspan>`).join('')}
          </text>
        </svg>`
      }).join('')}
    </div>`).join(''));
  }

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

  function postToApi(body) {
    return fetch('http://beehive.ecapacity.dk/data.php', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
})()
