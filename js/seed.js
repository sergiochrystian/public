import { db } from './firebase-init.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const produtosIniciais = [
    { nome: "FEIJOADA BABY COMPLETA (380ml)", categoria: "FEIJOADA", preco: 25.00, imagem: "assets/feijoada-baby.jpg", descricao: "Acompanha: arroz (380ML), farofa, pururuca, couve e laranja." },
    { nome: "FEIJOADA INDIVIDUAL COMPLETA (500ml)", categoria: "FEIJOADA", preco: 35.00, imagem: "assets/individual-completa.jpg", descricao: "Acompanha: arroz (500ML), farofa, pururuca, couve e laranja." },
    { nome: "FEIJOADA PARA 2 PESSOAS COMPLETA (750ml)", categoria: "FEIJOADA", preco: 45.00, imagem: "assets/feijoada-2-pessoas.jpg", descricao: "Acompanha: arroz (750ML), farofa, pururuca, couve e laranja." },
    { nome: "FEIJOADA FAMÍLIA COMPLETA (1000ml)", categoria: "FEIJOADA", preco: 70.00, imagem: "assets/feijoada-familia.jpg", descricao: "Acompanha: arroz (1000ML), farofa, pururuca, couve e laranja." },

    { nome: "Adicional de Feijoada Baby 380ml", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 15.00, imagem: "", descricao: "Somente a Feijoada 380ml" },
    { nome: "Adicional de Feijoada Individual 500ml", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 20.00, imagem: "", descricao: "Somente a Feijoada 500ml" },
    { nome: "Adicional de Feijoada Duas Pessoas 750ml", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 30.00, imagem: "", descricao: "Somente a Feijoada 750ml" },
    { nome: "Adicional de Feijoada Familia 1000ml", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 35.00, imagem: "", descricao: "Somente a Feijoada 1000ml" },

    { nome: "Porção Extra de Arroz 380g", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 5.00, imagem: "assets/arroz.jpg", descricao: "" },
    { nome: "Porção Extra de Arroz 500g", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 7.00, imagem: "assets/arroz.jpg", descricao: "" },
    { nome: "Porção Extra de Arroz 750g", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 10.00, imagem: "assets/arroz.jpg", descricao: "" },
    { nome: "Porção Extra de Arroz 1000g", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 15.00, imagem: "assets/arroz.jpg", descricao: "" },

    { nome: "Porção Extra de Pururuca (Tamanho G)", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 7.00, imagem: "assets/purucuca.jpg", descricao: "" },
    { nome: "Porção Extra de Farofa", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 4.00, imagem: "assets/farofa.jpg", descricao: "" },
    { nome: "Porção Extra de Couve", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 4.00, imagem: "assets/couve.jpg", descricao: "" },
    { nome: "Porção Extra de Laranja", categoria: "ADICIONAIS (ACOMPANHAMENTOS)", preco: 4.00, imagem: "assets/laranja.jpg", descricao: "" }
];

export async function semearBanco() {
    const snapshot = await getDocs(collection(db, "produtos"));
    if (!snapshot.empty) {
        console.log("Banco já possui produtos. Pulando semeadura.");
        return;
    }

    console.log("Iniciando cadastro de produtos...");
    for (let i = 0; i < produtosIniciais.length; i++) {
        const produto = produtosIniciais[i];
        await addDoc(collection(db, "produtos"), { ...produto, ordem: i });
        console.log(`Produto adicionado [${i}]: ${produto.nome}`);
    }
    console.log("Todos os produtos cadastrados com sucesso!");
    alert("Produtos cadastrados com sucesso no Firebase!");
}
