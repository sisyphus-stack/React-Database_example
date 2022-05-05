console.log('Hello World!');

//grabs element on the page
const form = document.querySelector('form'); 
//defines error message element
const errorElement = document.querySelector('.error-message');
//defines loading element (loading.gif)
const loadingElement = document.querySelector('.loading');

const dataElement = document.querySelector('.database');
const loadMoreElement = document.querySelector('#loadMore');
const API_URL = 'http://localhost:5000/database_1';

let skip = 0;
let limit = 5;
let loading = false;
let finished = false;

errorElement.style.display = 'none';

document.addEventListener('scroll', () => {
  const rect = loadMoreElement.getBoundingClientRect();
  if (rect.top < window.innerHeight && !loading && !finished) {
    loadMore();
  }
});

listAllData();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const content = formData.get('message');

  if (content.trim()) {
    errorElement.style.display = 'none';
    loadingElement.style.display = '';

    const data = {
      content
    };
    
    fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json'
      }
    }).then(response => {      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType.includes('json')) {
          return response.json().then(error => Promise.reject(error.message));
        } else {
          return response.text().then(message => Promise.reject(message));
        }
      }
    }).then(() => {
      form.reset();
      setTimeout(() => {
        form.style.display = '';
      }, 30000);
      listAllData();
    }).catch(errorMessage => {
      form.style.display = '';
      errorElement.textContent = errorMessage;
      errorElement.style.display = '';
      loadingElement.style.display = 'none';
    });
  } else {
    errorElement.textContent = 'Content are required!';
    errorElement.style.display = '';
  }
});

function loadMore() {
  skip += limit;
  listAllData(false);
}

function listAllData(reset = true) {
  loading = true;
  if (reset) {
    dataElement.innerHTML = '';
    skip = 0;
    finished = false;
  }
  fetch(`${API_URL}?skip=${skip}&limit=${limit}`)
    .then(response => response.json())
    .then(result => {
      result.data.forEach(data => {
        const div = document.createElement('div');

        const contents = document.createElement('p');
        contents.textContent = data.content;

        const date = document.createElement('small');
        date.textContent = new Date(data.created);

        div.appendChild(contents);
        div.appendChild(date);

        dataElement.appendChild(div);
      });
      loadingElement.style.display = 'none';
      if (!result.meta.has_more) {
        loadMoreElement.style.visibility = 'hidden';
        finished = true;
      } else {
        loadMoreElement.style.visibility = 'visible';
      }
      loading = false;
    });
}
