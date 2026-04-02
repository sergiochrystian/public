import { db } from './firebase-init.js';
import { collection, addDoc, getDocs, setDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const produtosIniciais = [
    { nome: "FEIJOADA BABY COMPLETA (380ml)", categoria: "FEIJOADA", preco: 25.00, imagem: "assets/feijoayla/cardapio/feijoada-baby.jpg", descricao: "Acompanha: arroz (380ML), farofa, pururuca, couve e laranja." },
    { nome: "FEIJOADA INDIVIDUAL COMPLETA (500ml)", categoria: "FEIJOADA", preco: 35.00, imagem: "assets/feijoayla/cardapio/individual-completa.jpg", descricao: "Acompanha: arroz (500ML), farofa, pururuca, couve e laranja." },
    { nome: "FEIJOADA PARA 2 PESSOAS COMPLETA (750ml)", categoria: "FEIJOADA", preco: 45.00, imagem: "assets/feijoayla/cardapio/feijoada-2-pessoas.jpg", descricao: "Acompanha: arroz (750ML), farofa, pururuca, couve e laranja." },
    { nome: "FEIJOADA FAMÍLIA COMPLETA (1000ml)", categoria: "FEIJOADA", preco: 70.00, imagem: "assets/feijoayla/cardapio/feijoada-familia.jpg", descricao: "Acompanha: arroz (1000ML), farofa, pururuca, couve e laranja." },

    { nome: "Adicional de Feijoada Baby 380ml", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 15.00, imagem: "", descricao: "Somente a Feijoada 380ml" },
    { nome: "Adicional de Feijoada Individual 500ml", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 20.00, imagem: "", descricao: "Somente a Feijoada 500ml" },
    { nome: "Adicional de Feijoada Duas Pessoas 750ml", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 30.00, imagem: "", descricao: "Somente a Feijoada 750ml" },
    { nome: "Adicional de Feijoada Familia 1000ml", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 35.00, imagem: "", descricao: "Somente a Feijoada 1000ml" },

    { nome: "Porção Extra de Arroz 380g", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 5.00, imagem: "assets/feijoayla/cardapio/arroz.jpg", descricao: "" },
    { nome: "Porção Extra de Arroz 500g", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 7.00, imagem: "assets/feijoayla/cardapio/arroz.jpg", descricao: "" },
    { nome: "Porção Extra de Arroz 750g", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 10.00, imagem: "assets/feijoayla/cardapio/arroz.jpg", descricao: "" },
    { nome: "Porção Extra de Arroz 1000g", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 15.00, imagem: "assets/feijoayla/cardapio/arroz.jpg", descricao: "" },

    { nome: "Porção Extra de Pururuca (Tamanho G)", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 7.00, imagem: "assets/feijoayla/cardapio/purucuca.jpg", descricao: "" },
    { nome: "Porção Extra de Farofa", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 4.00, imagem: "assets/feijoayla/cardapio/farofa.jpg", descricao: "" },
    { nome: "Porção Extra de Couve", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 4.00, imagem: "assets/feijoayla/cardapio/couve.jpg", descricao: "" },
    { nome: "Porção Extra de Laranja", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 4.00, imagem: "assets/feijoayla/cardapio/laranja.jpg", descricao: "" },

    { nome: "Coca-Cola 1L", categoria: "BEBIDAS", preco: 8.00, imagem: "assets/feijoayla/bebidas/coca-cola-1l.jpg", descricao: "" },
    { nome: "Guaraná Antártica 1L", categoria: "BEBIDAS", preco: 8.00, imagem: "assets/feijoayla/bebidas/guarana-1l.jpg", descricao: "" },
    { nome: "Coca-Cola ZERO 350ml", categoria: "BEBIDAS", preco: 5.00, imagem: "assets/feijoayla/bebidas/coca-zero-350.jpg", descricao: "" },
    { nome: "Coca-Cola 350ml", categoria: "BEBIDAS", preco: 5.00, imagem: "assets/feijoayla/bebidas/coca-350.jpg", descricao: "" }
];

export async function semearBanco() {
    console.log("Iniciando atualização/cadastro de produtos...");
    let adicionados = 0;
    let atualizados = 0;

    for (let i = 0; i < produtosIniciais.length; i++) {
        const produto = produtosIniciais[i];
        
        // Verifica se o produto já existe no banco (pelo nome)
        const q = query(collection(db, "produtos"), where("nome", "==", produto.nome));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Se existir, atualiza as informações (link da imagem, preço, etc)
            const id = snapshot.docs[0].id;
            await setDoc(doc(db, "produtos", id), { ...produto, ordem: i });
            console.log(`Produto atualizado: ${produto.nome}`);
            atualizados++;
        } else {
            // Se não existir, adiciona novo
            await addDoc(collection(db, "produtos"), { ...produto, ordem: i });
            console.log(`Produto adicionado: ${produto.nome}`);
            adicionados++;
        }
    }

    const mensagem = `${adicionados} novos e ${atualizados} atualizados com sucesso!`;
    console.log(mensagem);
    alert(mensagem);
    location.reload();
}

// Expõe para o console do navegador
window.semearBanco = semearBanco;
