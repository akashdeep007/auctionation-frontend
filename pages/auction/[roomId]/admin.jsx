import React from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import axios from '../../../utils/axios'
import { firestore } from '../../../utils/firebase'



import { Row, Col, Button } from 'antd'
import Layout from '../../../components/layout/Layout.jsx'
import AuctionLog from '../../../components/auction/AuctionLog.jsx'
import Item from '../../../components/auction/Item.jsx'
import ItemSelector from '../../../components/auction/ItemSelector.jsx'

const AdminPage = () => {
  const router = useRouter()
  const roomId = router.query.roomId;

  const auth_token = useSelector(state => state.user.auth_token)
  const wallet = useSelector(state => state.user.wallet)

  const [ firebaseRoomId, setFirebaseRoomId ] = React.useState(null)
  const [ auctionDetails, setAuctionDetails ] = React.useState(null)
  const [ itemData, setItemData ] = React.useState(null)
  const [ bids, setBids ] = React.useState([])
  const [ isLoading, setLoading ] = React.useState(false)

  //Update Firebase RoomId
  React.useEffect(() => {
    const fetchFirebaseRoomId = async () => {
      setLoading(true)
      console.log("Bearer " + auth_token)
      try{
        const res = await axios.get('/auction/room/' + roomId, {
          headers: {
            "Authorization": "Bearer " + auth_token
          }
        })

        setLoading(false)
        setFirebaseRoomId(res.data.data.message)
      } catch(err){
        setLoading(false)
      }
    }
    if(roomId) fetchFirebaseRoomId()
  }, [roomId, auth_token])

  //Subscribe to Bids Collection
  React.useEffect(() => {
    if(firebaseRoomId){
      const docRef = firestore.collection('auction').doc(firebaseRoomId)
      const bidsCollectionRef = docRef.collection('bids').orderBy("timestamp")
      docRef.onSnapshot((doc) => {
        if(doc.exists) setAuctionDetails(doc.data())
      })
      // console.log(bidsCollectionRef)
      bidsCollectionRef.onSnapshot((querySnapshot) => {
        let bids = []
        querySnapshot.forEach((doc) => {
          bids.push(doc.data())
        })
        // console.log(bids)
        setBids(bids)
      })
    }
  }, [firebaseRoomId])

  //Fetch Auction Details
  React.useEffect(() => {
    const fetchItemData = async () => {
      try{
        setLoading(true)
        const res = await axios.get('/players/' + auctionDetails.item_id)
        setItemData(res.data)
        setLoading(false)
      } catch(err){
        setLoading(false)
      }
    }
    if(auctionDetails && auctionDetails.item_id) fetchItemData()
  }, [auctionDetails])

  return(
    <Layout>
      { (!isLoading && !auctionDetails) ? (
        <ItemSelector />
       ) : (
         <Row>
           <Col span={24}>
             { itemData && (
               <Item item={itemData}>
                 <p><strong>Name: </strong> {itemData && itemData.name}</p>
                 <p><strong>Team: </strong> {itemData && itemData.team}</p>
                 <p><strong>Description: </strong> {itemData && itemData.description}</p>
                 <Button>End Auction</Button>
               </Item>
             )}
           </Col>
           <Col span={24}>
             <AuctionLog bids={bids}/>
           </Col>
         </Row>
       ) }

    </Layout>
  )
}

export default AdminPage
