import { useState,useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [data,setData]=useState([])
  const [topKeywords, setTopKeywords] = useState([])
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedKeywords, setExpandedKeywords] = useState([]);
  const [selectedAbstract, setSelectedAbstract] = useState(null);
  const itemsPerPage = 100;


  useEffect(() => {
    const offset = page * itemsPerPage;
    let query = `
      PREFIX dcterms: <http://purl.org/dc/terms/>
      PREFIX bibo: <http://purl.org/ontology/bibo/>
      PREFIX schema: <http://schema.org/>
      PREFIX vivo: <http://vivoweb.org/ontology/core#>
      select ?o_title ?o_freetextKeywords ?o_freetextKeywords_2 ?o_abstract
      where {
        ?s1 a bibo:AcademicArticle, schema:ScholarlyArticle ;
            dcterms:title ?o_title ;
            schema:abstract ?o_abstract ;
            vivo:freetextKeywords ?o_freetextKeywords ;
            vivo:freetextKeywords ?o_freetextKeywords_2 ;
    `;
    if (searchTerm) {
      query += `FILTER (regex(?o_title, "${searchTerm}", "i") || 
      regex(?o_freetextKeywords, "${searchTerm}", "i") || 
      regex(?o_freetextKeywords_2, "${searchTerm}", "i"))`;
    }
    query += `
      }
      OFFSET ${offset}
      LIMIT ${itemsPerPage + 1}
    `;

    axios
      .post('http://LAPTOP-5NCUS4C8:7200/repositories/SBC', query, {
        headers: { 'Content-Type': 'application/sparql-query' },
      })
      .then((response) => {
        const results = response.data.results.bindings;
        if (results.length > itemsPerPage) {
          setData(results.slice(0, -1));
          setHasNextPage(true);
        } else {
          setData(results);
          setHasNextPage(false);
        }
      });
  }, [page, searchTerm]);

  useEffect(() => {
    const query = `
       PREFIX vivo: <http://vivoweb.org/ontology/core#>
      SELECT ?keyword (COUNT(?s1) AS ?count)
      WHERE {
        ?s1 vivo:freetextKeywords ?keyword .
      }
      GROUP BY ?keyword
      ORDER BY DESC(?count)
      LIMIT 5
    `;

    axios
      .post('http://LAPTOP-5NCUS4C8:7200/repositories/SBC', query, {
        headers: { 'Content-Type': 'application/sparql-query' },
      })
      .then((response) => {
        setTopKeywords(response.data.results.bindings);
      });
  }, []);


const handleNextPage = () => {
  setPage((prevPage) => prevPage + 1);
};
const handlePrevPage = () => {
  setPage((prevPage) => Math.max(prevPage - 1, 0));
};
const handleSearchChange = (event) => {
  setSearchTerm(event.target.value);
};

const handleToggleKeywords = (index) => {
  setExpandedKeywords((prevExpandedKeywords) =>
    prevExpandedKeywords.includes(index)
      ? prevExpandedKeywords.filter((i) => i !== index)
      : [...prevExpandedKeywords, index]
  );
};

const handleShowAbstract = (abstract) => {
    setSelectedAbstract(abstract);
    console.log("Abstract:", abstract);
  };
  console.log("Selected Abstract:", selectedAbstract);

const handleCloseAbstract = () => {
    setSelectedAbstract(null);
  };

  return (
    <>
      <h1 >PROTOTIPO SBC SEGUNDO BIMESTRE </h1>
      <div className="search-container">
        <label htmlFor="search">Buscar:</label>
        <input
          type="text"
          id="search"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      <div className="pagination">
        {page > 0 && (
          <button onClick={handlePrevPage}>Página anterior</button>
        )}
        {hasNextPage && (
          <button onClick={handleNextPage}>Siguiente página</button>
        )}
      </div>
      <div className="card">
        <h4>Top 5 Keywords</h4>
        <div className="keyword-container">
          {topKeywords.map((item, index) => (
            <div key={index} className="keyword">{item.keyword.value} ({item.count.value})</div>
          ))}
        </div>
      </div>
      <div className="card-container">
        {data.map((item, index) => {
          const keywords = [
            ...item.o_freetextKeywords.value.split(';'),
            ...item.o_freetextKeywords_2.value.split(';'),
          ];
          const visibleKeywords = expandedKeywords.includes(index)
            ? keywords
            : keywords.slice(0, 3);
          return (
            <div key={index} className="card">
              <h4>{item.o_title.value}</h4>
              <div className="keyword-container">
                {visibleKeywords.map((keyword, index) => (
                  <div key={index} className="keyword">{keyword}</div>
                ))}
              </div>
              {keywords.length > 3 && (
                <button className='button-keywords' onClick={() => handleToggleKeywords(index)}>
                  {expandedKeywords.includes(index) ? 'Mostrar menos' : 'Mostrar más'}
                </button>
                
              )}
              <button className='button-abstract' onClick={() => handleShowAbstract(item.o_abstract.value)}>Mostrar abstract</button>
            </div>
          );
        })}
      </div>
      {selectedAbstract && (
        <div className="modal" onClick={handleCloseAbstract}>
          <div className="modal-content">
            <p>{selectedAbstract}</p>
          </div>
        </div>
      )}
    </>
  )
}

export default App
